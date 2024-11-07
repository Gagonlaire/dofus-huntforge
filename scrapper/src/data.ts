import {ModalContent} from "../types";

export const modalContent: ModalContent = {
    noHint: {
        fr: "Aucun indice trouvé",
        en: "No clue found"
    },
    reCAPTCHA: {
        // todo: fill
        fr: "",
        en: "",
    },
}

export const selectors = {
    modalContent: 'body > div.q-dialog.fullscreen.no-pointer-events.q-dialog--modal > div.q-dialog__inner.flex.no-pointer-events.q-dialog__inner--minimized.q-dialog__inner--standard.fixed-full.flex-center > div > div.column.q-pa-md > div',
    modalValidateButton: 'body > div.q-dialog.fullscreen.no-pointer-events.q-dialog--modal > div.q-dialog__inner.flex.no-pointer-events.q-dialog__inner--minimized.q-dialog__inner--standard.fixed-full.flex-center > div > div.q-card__actions.q-mt-md.q-card__actions--horiz.row.justify-end > button',
    hintPositionFields: '.q-field__native',
    hintDirectionButtons: '.treasure-hunt-direction-icon',
}
