import { ref } from 'vue'

const isUpgradeModalOpen = ref(false)
const upgradeMessage = ref('')

/**
 * Global upgrade modal yönetimi.
 * PLAN_LIMIT_EXCEEDED hatalarında kullanılır.
 */
export function useUpgradeModal() {
  function show(message: string) {
    upgradeMessage.value = message
    isUpgradeModalOpen.value = true
  }

  function hide() {
    isUpgradeModalOpen.value = false
  }

  return {
    isOpen: isUpgradeModalOpen,
    message: upgradeMessage,
    show,
    hide,
  }
}
