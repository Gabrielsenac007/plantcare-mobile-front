import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../src/theme/colors";
import { fonts } from "../../src/theme/typography";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bold },
      }}
    >
      {(
        [
          { name: "index", title: "Início", icon: "home-outline" },
          { name: "plants", title: "Plantas", icon: "leaf-outline" },
          {
            name: "categories",
            title: "Categorias",
            icon: "pricetags-outline",
          },
          { name: "settings", title: "Ajustes", icon: "settings-outline" },
        ] as const
      ).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name={tab.icon}
                size={size}
                color={focused ? colors.primary : colors.muted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
