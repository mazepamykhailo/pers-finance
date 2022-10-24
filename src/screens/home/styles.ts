import { StyleSheet, Dimensions } from 'react-native';
import { ThemesConfig } from '../../interfaces/themes.interface';
import Constants from 'expo-constants';

export const styles = (theme: ThemesConfig) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background.primary,
            paddingTop: Constants.statusBarHeight
        }
    })
};
