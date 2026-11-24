// The language and theme menus.

import { Menu } from "@base-ui/react/menu";
import { Check, Languages, Monitor, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { changeLocale, locales, nativeName, useLocale } from "~/lib/locale";
import { changeTheme, type Theme, themes, useTheme } from "~/lib/theme";
import { m } from "~/paraglide/messages.js";
import { IconButton } from "~/ui/ui";

const THEME_ICONS: Record<Theme, ReactNode> = {
  system: <Monitor className="size-4" />,
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
};

const THEME_NAMES: Record<Theme, () => string> = {
  system: m.theme_system,
  light: m.theme_light,
  dark: m.theme_dark,
};

export function Preferences() {
  const locale = useLocale();
  const theme = useTheme();
  return (
    <div className="flex items-center">
      <Choice
        label={m.language()}
        icon={<Languages className="size-4" />}
        options={locales}
        value={locale}
        name={(value) => <span lang={value}>{nativeName(value)}</span>}
        onChange={changeLocale}
      />
      <Choice
        label={m.theme()}
        icon={THEME_ICONS[theme]}
        options={themes}
        value={theme}
        name={(value) => THEME_NAMES[value]()}
        onChange={changeTheme}
      />
    </div>
  );
}

type ChoiceProps<T extends string> = {
  label: string;
  icon: ReactNode;
  options: readonly T[];
  value: T;
  name: (value: T) => ReactNode;
  onChange: (value: T) => void;
};

function Choice<T extends string>({ label, icon, options, value, name, onChange }: ChoiceProps<T>) {
  return (
    <Menu.Root>
      <Menu.Trigger render={<IconButton label={label} />}>{icon}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup className="min-w-36 rounded-lg border border-line bg-raised p-1 shadow-lg outline-none">
            <Menu.RadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
              {options.map((option) => (
                <Menu.RadioItem
                  key={option}
                  value={option}
                  className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none data-[highlighted]:bg-hover"
                >
                  <span className="flex-1">{name(option)}</span>
                  <Menu.RadioItemIndicator>
                    <Check className="size-3.5 text-accent" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
