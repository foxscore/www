//region OnInitialize
const __initializers__ = [];
function onInitialize(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const func = descriptor.value;
    if (typeof func !== 'function')
        throw new Error(`Element '${func.name ?? propertyKey}' with attribute 'onInitialize' is not a function'`)
    if (func.length !== 0)
        throw new Error(`Element '${func.name ?? propertyKey}' has the onInitialize attribute and takes arguments, which is not allowed`);

    if (__initializers__) {
        __initializers__.push(func);
    } else {
        // ToDo: Try to run the function. Show an error notification on fail.
    }
}
function localhost(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
        if (window.location.hostname !== 'localhost') {
            return undefined;
        }
        return originalMethod.apply(this, args);
    };

    return descriptor;
}
function production(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
        if (window.location.hostname === 'foxscore.dev') {
            return undefined;
        }
        return originalMethod.apply(this, args);
    };

    return descriptor;
}
//endregion

enum Variant {
    Primary = 'primary',
    Success = 'success',
    Neutral = 'neutral',
    Warning = 'warning',
    Danger = 'danger',
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

abstract class Static {
    protected constructor() {
        throw new Error('Class "Notifications" is static-only');
    }
}

class Core extends Static {
    private static readonly _scripts: string[] = [
        'notifications'
    ];

    private static _didInit: boolean = false;

    private static ShowFatalError(message: string): void {
        document.getElementById('main-fatal-error-message').innerText = message;
        document.getElementById('main-fatal-error').removeAttribute('hidden');
        const loader = document.getElementById('main-loading-screen');
        if (loader) loader.setAttribute('hidden', null);
        document.getElementById('main').setAttribute('hidden', null);
        document.getElementById('nav').setAttribute('hidden', null);
    }

    private static mainElement: HTMLElement;
    private static navElement: HTMLElement;

    public static async Init() {
        Core._didInit = true;

        Core.mainElement = document.getElementById('main');
        Core.navElement = document.getElementById('nav');

        // ToDo: Respect async functions
        for (const initializer of __initializers__) {
            try {
                await initializer();
            } catch (e) {
                console.error('A initializer function failed to run', e);
                Core.ShowFatalError('Failed to initialize a core script');
                return;
            }
        }

        Core.mainElement.removeAttribute('hidden');
        Core.navElement.removeAttribute('hidden');

        document.getElementById('nav-toggle').removeAttribute('invisible');
    }

    private static readonly symbolsToReplaceOnEscape = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };

    public static escapeHtml(text: string): string {
        return text.replace(/[&<>]/g, (tag: any) => {
            return Core.symbolsToReplaceOnEscape[tag] || tag;
        });
    }

    public static GetEnumFromString<T>(enumType: any, stringValue: string): T[keyof T] | undefined {
        return Object.values(enumType).find(enumValue => enumValue === stringValue) as T[keyof T];
    }

    public static ToggleNavigation(): void {
        console.log(Core.navElement);
        if (Core.navElement.hasAttribute("expanded")) {
            Core.navElement.removeAttribute("expanded");
        } else {
            Core.navElement.setAttribute("expanded", null);
        }
    }

    public static CopyToClipboard(value: string) {
        try {
            navigator.clipboard.writeText(value).then(r => Notifications.Show(
                'Copied to clipboard',
                {
                    variant: Variant.Success,
                    duration: 3500,
                } as NotificationsOptions
            ));
        } catch (err) {
            console.error(err);
            Notifications.Show(
                'Failed to copy to clipboard',
                {
                    variant: Variant.Danger,
                } as NotificationsOptions
            )
        }
    }
}

window.onload = Core.Init;