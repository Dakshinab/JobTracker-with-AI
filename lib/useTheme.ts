import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  return { theme, isDark };
}