import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Spinner, { SpinnerItem } from './components/Spinner';

const HomeScreen = () => {
  const items: (SpinnerItem | null)[] = [
    { id: 'k', label: '🔑' }, // product 1
    null, // empty
    { id: 'bag', label: '💰' }, // product 2
    null,
    { id: 'zap', label: '⚡️' }, // product 3
    null,
    { id: 'loop', label: '🔁' }, // product 4
    null,
  ];
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Spinner
        size={330}
        onStop={(index, item) => {
          console.log('Selected slice:new one', index, item);
        }}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
