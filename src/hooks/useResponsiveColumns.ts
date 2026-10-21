import { useWindowDimensions } from "react-native";
export function useResponsiveColumns() {
  const { width } = useWindowDimensions();
  return width < 600 ? 1 : width < 900 ? 2 : 3;
}
