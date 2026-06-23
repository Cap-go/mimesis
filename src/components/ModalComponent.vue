<script setup lang="ts">
import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

defineProps({
  open: {
    type: Boolean,
    require: true,
  },
})

defineEmits(['close'])
</script>

<template>
  <TransitionRoot as="template" :show="open">
    <Dialog
      as="div"
      auto-reopen="true"
      class="fixed inset-0 z-10 overflow-y-auto"
      @close="$emit('close')"
    >
      <div
        class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogOverlay
            class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          />
        </TransitionChild>

        <!-- This element is to trick the browser into centering the modal contents. -->
        <span
          class="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >&#8203;</span>
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            class="inline-block w-full max-h-screen px-6 pt-6 pb-5 overflow-y-auto align-bottom transition-all transform border-2 shadow-xl border-rose-500 text-rose-500 bg-lavender-500 rounded-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8"
          >
            <div>
              <div
                class="flex items-center justify-center w-14 h-14 mx-auto border-2 rounded-full bg-pizazz-500 border-rose-500 shadow-sm"
              >
                <slot name="icon" />
              </div>
              <div class="mt-4 text-center sm:mt-6">
                <DialogTitle
                  as="h3"
                  class="text-3xl font-bold leading-tight text-rose-500 first-letter:uppercase sm:text-4xl"
                >
                  <slot name="title" />
                </DialogTitle>
                <div class="mt-4">
                  <div class="text-base leading-relaxed text-rose-500 sm:text-lg">
                    <slot name="content" />
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 mt-6 justify-center sm:mt-8 sm:gap-3">
              <slot name="buttons" />
            </div>
          </div>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
