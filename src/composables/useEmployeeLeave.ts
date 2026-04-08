import { ref } from 'vue'
import { employeeApi, type CreateLeaveRequest, type LeaveConflictPreviewResponse, type LeaveResponse, type ResolveAndCreateLeaveRequest } from '../api/employee'

export function useEmployeeLeave(employeeId: number) {
  const leaves = ref<LeaveResponse[]>([])
  const loading = ref(false)
  const conflictPreview = ref<LeaveConflictPreviewResponse | null>(null)
  const conflictLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadLeaves() {
    loading.value = true
    error.value = null
    try {
      const res = await employeeApi.listLeaves(employeeId)
      leaves.value = res.data.data ?? []
    } catch {
      error.value = 'İzinler yüklenemedi'
    } finally {
      loading.value = false
    }
  }

  async function previewConflicts(request: CreateLeaveRequest): Promise<LeaveConflictPreviewResponse | null> {
    conflictLoading.value = true
    conflictPreview.value = null
    try {
      const res = await employeeApi.previewLeaveConflicts(employeeId, request)
      conflictPreview.value = res.data.data ?? null
      return conflictPreview.value
    } catch {
      return null
    } finally {
      conflictLoading.value = false
    }
  }

  async function createLeave(request: CreateLeaveRequest): Promise<LeaveResponse | null> {
    try {
      const res = await employeeApi.createLeave(employeeId, request)
      const created = res.data.data
      if (created) {
        leaves.value.unshift(created)
      }
      return created ?? null
    } catch {
      return null
    }
  }

  async function resolveAndCreate(request: ResolveAndCreateLeaveRequest): Promise<LeaveResponse | null> {
    try {
      const res = await employeeApi.resolveAndCreateLeave(employeeId, request)
      const created = res.data.data
      if (created) {
        leaves.value.unshift(created)
      }
      conflictPreview.value = null
      return created ?? null
    } catch {
      return null
    }
  }

  async function cancelLeave(leaveId: number): Promise<boolean> {
    try {
      await employeeApi.cancelLeave(employeeId, leaveId)
      leaves.value = leaves.value.map(l =>
        l.id === leaveId ? { ...l, status: 'CANCELLED' as const } : l
      )
      return true
    } catch {
      return false
    }
  }

  return {
    leaves,
    loading,
    conflictPreview,
    conflictLoading,
    error,
    loadLeaves,
    previewConflicts,
    createLeave,
    resolveAndCreate,
    cancelLeave,
  }
}
