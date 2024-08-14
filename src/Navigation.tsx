// src/Navigation.tsx
import * as React from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import InitialScreen from './screens/Initial.Screen';
import ImportWalletScreen from './screens/ImportWallet.Screen';
import WalletDashboardScreen from './screens/WalletDashboard.Screen';
import MnemonicsScreen from './screens/Mnemonics.Screen';
import WalletHistoryScreen from './screens/WalletHistory.Screen';
import PasscodeScreen from './screens/Passcode.Screen';
import TransferScreen from './screens/Transfer.Screen';
import MnemonicsConfirmationScreen from './screens/MnemonicsConfirmation.Screen';
import ConvertScreen from './screens/Convert.screen';
import SettingsScreen from './screens/WalletSettings.screen'
import { CreditAndToken, Token, TokenDashboardAsset } from './types/interfaces';

export type RootStackParamList = {
  Initial: {previousScreen?: string};
  CreateWallet: {previousScreen?: string};
  ImportWallet: {previousScreen?: string};
  WalletDashboard: {previousScreen?: string};
  Mnemonics: {previousScreen?: string};
  MnemonicsConfirmation: {previousScreen?: string};
  WalletHistory: {tokens: Token[]};
  Passcode: {previousScreen?: string};
  Transfer: {tokens: Token[]};
  Convert: {data: CreditAndToken};
  WalletSettings: {data?: any}
};

const Stack = createStackNavigator<RootStackParamList>();

function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Passcode"
        screenOptions={{headerShown: false}}>
        <Stack.Screen
          name="Initial"
          component={InitialScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Mnemonics"
          component={MnemonicsScreen}
          options={{title: 'Mnemonics'}}
        />
        <Stack.Screen
          name="MnemonicsConfirmation"
          component={MnemonicsConfirmationScreen}
          options={{title: 'Mnemonics'}}
        />
        <Stack.Screen
          name="ImportWallet"
          component={ImportWalletScreen}
          options={{title: 'Import Wallet'}}
        />
        <Stack.Screen
          name="WalletDashboard"
          component={WalletDashboardScreen}
          options={{title: 'Wallet Dashboard'}}
        />
        <Stack.Screen
          name="WalletHistory"
          component={WalletHistoryScreen}
          options={{title: 'Wallet History'}}
        />
        <Stack.Screen
          name="Passcode"
          component={PasscodeScreen}
          options={{title: 'Passcode'}}
        />
        <Stack.Screen
          name="Transfer"
          component={TransferScreen}
          options={{title: 'Transfer'}}
        />
        <Stack.Screen
          name="Convert"
          component={ConvertScreen}
          options={{
            headerTransparent: true,
            //headerShown: true,
            headerBackTitleVisible: false,
            headerTintColor: 'white',
            headerStyle: {backgroundColor: 'black'},
          }}
        />
          <Stack.Screen
          name="WalletSettings"
          component={SettingsScreen}
          options={{
            headerTransparent: true,
            //headerShown: true,
            headerBackTitleVisible: false,
            headerTintColor: 'white',
            headerStyle: {backgroundColor: 'black'},
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;
