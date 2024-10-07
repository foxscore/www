import { nodeModuleNameResolver } from "typescript";

enum Placement {
    Top = "top",
    TopStart = "top-start",
    TopEnd = "top-end",
    Bottom = "bottom",
    BottomStart = "bottom-start",
    BottomEnd = "bottom-end",
    Left = "left-start",
    LeftStart = "left-start",
    LeftEnd = "left-end",
    Right = "right-start",
    RightStart = "right-start",
    RightEnd = "right-end",
}

class TooltipOptions {
    public allowHtml: boolean = false;
    public placement: Placement|string|null;
    public arrow: boolean = false;
    public variant: Variant|'nav-item'|string = Variant.Neutral;
    public delay: number|null = null;
}

class Tooltips extends Static {
    @onInitialize
    static init() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                for(var i = 0; i < mutation.addedNodes.length; i++)
                    Tooltips.ScanElement(mutation.addedNodes[i] as HTMLElement);
            })
        });
        observer.observe(document, {
            childList: true
        });

        // Get all elements with the tooltip attribute
        const initialElements = document.querySelectorAll("[tooltip]");
        initialElements.forEach(Tooltips.ScanElement);
    }

    private static ScanElement(element: HTMLElement) {
        const message = element.getAttribute("tooltip");
        if (!message) return;
        const options = new TooltipOptions();
        options.allowHtml = element.hasAttribute("tooltip-allowHtml");
        options.arrow = element.hasAttribute("tooltip-arrow");
        options.variant = element.getAttribute("tooltip-variant");
        options.placement = element.getAttribute("tooltip-placement");
        options.delay = element.hasAttribute("tooltip-delay")
            ? parseInt(element.getAttribute("tooltip-delay"))
            : null;
        Tooltips.Spawn(element, message, options);
    }

    public static Spawn(element: HTMLElement, content: string, options: TooltipOptions = null) {
        // @ts-ignore
        tippy(element, {
            content: content,
            allowHTML: options?.allowHtml ?? false,
            placement: options?.placement ?? undefined,
            arrow: options?.arrow ?? false,
            theme: options?.variant ?? Variant.Neutral,
            delay: [options?.delay ?? 500, 0],
            animation: 'shift-away',
        });
    }
}