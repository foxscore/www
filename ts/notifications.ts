class NotificationsOptions {
    public variant: Variant | string = Variant.Neutral;
    public icon: string | null = null;
    public duration: number = 0;
    public allowHtml: boolean = false;
    public hideCloseButton: boolean = false;
}

class Notifications extends Static {
    private static container: HTMLElement;

    @onInitialize
    static async init() {
        Notifications.container = document.createElement('notification-container');
        document.body.appendChild(Notifications.container);
    }

    public static Show(message: string, options: NotificationsOptions | null = null): HTMLElement {
        let element = document.createElement('notification');
        element.setAttribute(options.variant, null);

        let content = document.createElement('content');
        if (options.allowHtml)
            content.innerHTML = message;
        else
            content.innerText = message;
        element.appendChild(content);

        let isClosed: boolean = false;
        function closeElement() {
            if (isClosed) return;
            element.classList.remove('shown');
            element.classList.add('closing');
            setTimeout(() => element.remove(), 150);
        }

        if (!options.hideCloseButton) {
            let closeButton = document.createElement('close');
            closeButton.innerHTML = `<i class="nf nf-fae-thin_close"></i>`;
            closeButton.onclick = closeElement;
            element.appendChild(closeButton);
        }

        if (options.duration > 0) {
            setTimeout(closeElement, options.duration);
        }

        element = Notifications.container.appendChild(element);
        setTimeout(() => {
            element.classList.add('shown');
        }, 1);
        return element;
    }
}