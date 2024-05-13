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
            class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
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
            class="inline-block px-4 pt-5 pb-4 overflow-hidden align-bottom transition-all transform border-2 rounded-lg shadow-xl border-rose-500 text-rose-500 bg-pizazz-500 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
          >
            <div>
              <div
                class="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full"
              >
                <slot name="icon" />
              </div>
              <div class="mt-3 text-center sm:mt-5">
                <DialogTitle
                  as="h3"
                  class="text-4xl font-semibold text-gray-50 first-letter:uppercase"
                >
                  <slot name="title" />
                </DialogTitle>
                <div class="mt-2">
                  <p class="pt-5 text-sm text-yellow-200">
                    <slot name="content" />
                  </p>
                </div>
              </div>
            </div>
            <div name="buttons" class="flex mt-5 justify-items-center">
              <slot name="buttons" />
            </div>
          </div>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
