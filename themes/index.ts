export interface Theme {
  name: string;
  description: string;
  version: string;
  colors: {
    splash: {
      background: {
        base: string;
        gradient: string;
        glowIndigo: string;
        glowCyan: string;
      };
      headline: {
        color: string;
        neonGlow: string;
        fontFamily: string;
      };
      monitor: {
        bezel: string;
        border: string;
        borderBottom: string;
        screen: string;
        screenBorder: string;
        powerLight: string;
      };
      button: {
        background: string;
        border: string;
        text: string;
        shadow: string;
        hoverBackground: string;
        hoverBorder: string;
        hoverShadow: string;
      };
      icons: {
        primary: string;
        amber: string;
        emerald: string;
      };
      text: {
        primary: string;
        secondary: string;
        meta: string;
      };
    };
    andromeda: {
      background: {
        main: string;
        overlay: string;
      };
      chat: {
        userBubble: string;
        userText: string;
        userShadow: string;
        aiBubble: string;
        aiBorder: string;
        aiText: string;
        aiShadow: string;
      };
      header: {
        background: string;
        border: string;
        iconGradientFrom: string;
        iconGradientTo: string;
        titleFrom: string;
        titleTo: string;
        subtitle: string;
      };
      sidebar: {
        background: string;
        border: string;
        chatHover: string;
        chatActive: string;
      };
      accents: {
        cyan: string;
        blue: string;
        slate: string;
      };
      ambientGlow: {
        topRight: string;
        bottomLeft: string;
      };
    };
    global: {
      primary: string;
      secondary: string;
      accent: string;
      success: string;
      warning: string;
      error: string;
      info: string;
      background: {
        dark: string;
        darker: string;
        light: string;
      };
      text: {
        primary: string;
        secondary: string;
        muted: string;
      };
      border: {
        default: string;
        light: string;
        dark: string;
      };
    };
  };
  effects: {
    matrix: {
      enabled: boolean;
      color: string;
      opacity: number;
      speed: string;
    };
    glassmorphism: {
      enabled: boolean;
      blur: string;
      opacity: number;
    };
    neonGlow: {
      enabled: boolean;
      color: string;
      intensity: string;
    };
  };
}

export type ThemeName = 'standard' | 'dark';

export const loadTheme = async (themeName: ThemeName): Promise<Theme> => {
  const response = await fetch(`/themes/${themeName}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load theme: ${themeName}`);
  }
  return response.json();
};
