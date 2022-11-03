import { StyleSheet } from 'react-native';
import { ThemesConfig } from '../../types/screens/themes.type';
import Constants from 'expo-constants'

export const styles = (theme: ThemesConfig) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background.primary,
            paddingTop: Constants.statusBarHeight
        },
        containerList: {
            marginTop: 20,
            padding: 8,
            flex: 1
        }
    })
};
