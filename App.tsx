import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';

/*
 ** App color tokens (match CinePlay theme)
 */
const COLORS = {
  primary: '#E43636',
  cream: '#F6EFD2',
  gold: '#E2DDB4',
  black: '#000000',
};

/*
 ** Navigation types
 */
export type RootStackParamList = {
  Home: undefined;
  AllVideos: undefined;
  Folders: undefined;
  Photos: undefined;
  Notes: undefined;
  Player: { uri?: string; title?: string } | undefined;
  Settings: undefined;
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/*
 ** Custom theme (dark cinematic)
 */
const NavTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.black,
    card: COLORS.black,
    text: COLORS.cream,
    border: COLORS.gold,
    primary: COLORS.primary,
    notification: COLORS.primary,
  },
};

const App = () => {
  return (
    <NavigationContainer theme={NavTheme}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.black },
          headerTitleStyle: { color: COLORS.cream },
          headerTintColor: COLORS.gold,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
  },
  text: { color: COLORS.cream, fontSize: 18, fontWeight: '600' },
});
