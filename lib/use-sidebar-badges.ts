'use client'

import { useRealtimeCount } from './use-realtime'

export function useSidebarBadges() {
  const { count: pendingApprovals } = useRealtimeCount('emp_employees', {
    status: 'Pending',
  })
  const { count: offerSent } = useRealtimeCount('emp_employees', {
    status: 'Offer Sent',
  })
  const { count: pendingAccess } = useRealtimeCount('emp_access_requests', {
    status: 'pending',
  })
  const { count: openEnquiries } = useRealtimeCount('emp_enquiries', {
    status: 'open',
  })
  const { count: pendingMentorRegs } = useRealtimeCount('emp_mentor_registrations', {
    status: 'Pending',
  })

  return {
    pendingApprovalCount: (pendingApprovals || 0) + (offerSent || 0),
    pendingAccessRequestCount: pendingAccess || 0,
    newEnquiryCount: openEnquiries || 0,
    pendingMentorRegistrations: pendingMentorRegs || 0,
  }
}
