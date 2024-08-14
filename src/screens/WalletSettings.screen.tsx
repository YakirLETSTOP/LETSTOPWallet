import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../Navigation'; // Assuming you have this type defined
import {useWallet} from '../contexts/WalletContext';
import Icon5 from 'react-native-vector-icons/FontAwesome5'; // Changed to FontAwesome5
import IconFeather from 'react-native-vector-icons/Feather';

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'WalletSettings'
>;

const SettingItem: React.FC<{
  title: string;
  onPress: () => void;
  iconName: string;
}> = ({title, onPress, iconName}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemContent}>
      {title == 'Terms of Use' ? (
        <IconFeather
          name={iconName}
          size={20}
          color="#FFFFFF"
          style={styles.settingIcon}
        />
      ) : (
        <Icon5
          name={iconName}
          size={20}
          color="#FFFFFF"
          style={styles.settingIcon}
        />
      )}
      <Text style={styles.settingText}>{title}</Text>
    </View>
    <Icon5 name="angle-right" size={20} color="#8E8E93" />
  </TouchableOpacity>
);

const WalletSettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {logout} = useWallet(); // Assuming you have a logout function in your WalletContext

  const handleBackup = () => {
    // Implement wallet backup logic
    // Add prompt for passcode - only valid passcode allows revealing the mnemonics
    console.log('Backup wallet');
    navigation.navigate( 'Mnemonics' , {previousScreen: 'settings'})
  };

  const handleSecurity = () => {
    // Navigate to security settings
    console.log('Navigate to security settings');
  };

  const handleSupport = () => {
    // Navigate to help & support
    console.log('Navigate to help & support');
  };

  const handleFAQ = () => {
    // Navigate to FAQ
    console.log('Navigate to FAQ');
  };

  const handleTerms = () => {
    // Navigate to Terms of Use
    console.log('Navigate to Terms of Use');
  };

  const handlePrivacy = () => {
    // Navigate to Privacy Policy
    console.log('Navigate to Privacy Policy');
  };

  const handleLogout = () => {
    logout();
    // Navigate to login screen or perform any other necessary actions
    console.log('User logged out');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon5 name="chevron-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet & Security</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title="Backup Wallet"
              onPress={handleBackup}
              iconName="user-circle"
            />
            <SettingItem
              title="Security Settings"
              onPress={handleSecurity}
              iconName="shield-alt"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title="Help & Support"
              onPress={handleSupport}
              iconName="info-circle"
            />
            <SettingItem
              title="FAQ"
              onPress={handleFAQ}
              iconName="question-circle"
            />
            <SettingItem
              title="Terms of Use"
              onPress={handleTerms}
              iconName="book"
            />
            <SettingItem
              title="Privacy Policy"
              onPress={handlePrivacy}
              iconName="file-alt"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon5
            name="sign-out-alt"
            size={20}
            color="#FFFFFF"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
    width: 20,
    height: 20,
  },
  settingText: {
    color: 'white',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'red',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 20,
    marginHorizontal: 18,
    marginTop: 32,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WalletSettingsScreen;
