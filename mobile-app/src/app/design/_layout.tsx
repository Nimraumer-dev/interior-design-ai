import { Stack } from 'expo-router';

export default function DesignLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        gestureEnabled: true,
      }}
    />
  );
}
