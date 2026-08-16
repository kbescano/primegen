import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/getPayloadClient'; // ✨ Using your existing utility instead!

// Force Next.js to never cache this route so it runs fresh every time
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // ✨ Initialize Payload using your custom helper
    const payload = await getPayloadClient();
    
    // Calculate exactly 5 minutes ago
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Find all 'pending' requests that haven't been updated in 5+ mins
    const staleRequests = await payload.find({
      collection: 'quotation-requests',
      where: {
        and: [
          { status: { equals: 'pending' } },
          { assignedTo: { not_equals: null } }, // Ensures someone is actually assigned
          { updatedAt: { less_than: fiveMinsAgo } },
        ]
      },
      limit: 100,
    });

    if (staleRequests.docs.length === 0) {
      return NextResponse.json({ success: true, message: 'No stale requests found right now.' });
    }

    // Get staff list for round-robin
    const staffList = await payload.find({
      collection: 'users',
      where: { role: { equals: 'user' } },
      sort: 'id',
      limit: 100,
    });

    if (staffList.docs.length < 2) {
      return NextResponse.json({ success: true, message: 'Not enough staff to rotate.' });
    }

    const staffIds = staffList.docs.map(u => u.id);
    let reassignedCount = 0;

    // Process every stuck request
    for (const req of staleRequests.docs) {
      const currentStaffId = typeof req.assignedTo === 'object' ? req.assignedTo?.id : req.assignedTo;
      let nextStaffId = staffIds[0];

      if (currentStaffId) {
        const currentIndex = staffIds.findIndex(id => String(id) === String(currentStaffId));
        if (currentIndex !== -1 && currentIndex < staffIds.length - 1) {
          nextStaffId = staffIds[currentIndex + 1];
        }
      }

      // Reassign the ticket! (This resets updatedAt and triggers your notification hooks)
      await payload.update({
        collection: 'quotation-requests',
        id: req.id,
        data: { assignedTo: nextStaffId }
      });
      
      reassignedCount++;
      console.log(`[Auto-Assign] Inquiry ${req.id} moved to Staff ${nextStaffId}`);
    }

    return NextResponse.json({ success: true, message: `Successfully reassigned ${reassignedCount} inquiries.` });
    
  } catch (error) {
    console.error('[Auto-Assign Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to process auto-assign' }, { status: 500 });
  }
}