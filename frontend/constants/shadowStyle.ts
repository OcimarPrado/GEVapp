import { Platform, StyleProp, ViewStyle } from 'react-native';

let shadowStyle: StyleProp<ViewStyle> = {};

if (Platform.OS === 'ios') {
  shadowStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  };
} else if (Platform.OS === 'android') {
  shadowStyle = {
    elevation: 3,
  };
} else if (Platform.OS === 'web') {
  shadowStyle = {
    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)',
  };
}

export default shadowStyle;