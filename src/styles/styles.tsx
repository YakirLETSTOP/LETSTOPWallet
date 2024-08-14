import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

const colors = {
  background: 'black',
  cardBackground: '#1C1C1E',
  primary: '#FF4500',
  secondary: '#2C2C2E',
  text: {
    primary: '#FFFFFF',
    secondary: '#8E8E93',
    tertiary: '#A1A1A1',
  },
  button: {
    primary: '#FF3B30',
    secondary: '#3A3A3C',
    disabled: '#474747',
  },
  status: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
};

const typography = {
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  body: {
    fontSize: 16,
    color: colors.text.primary,
  },
  caption: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
};

const layout = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
};

const buttons = {
  primary: {
    backgroundColor: colors.button.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.button.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  text: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
};

const inputs = {
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: colors.text.primary,
    fontSize: 16,
  },
};

export const globalStyles = StyleSheet.create({
  // Container styles
  container: layout.container,
  card: layout.card,
  row: layout.row as ViewStyle,
  
  // Typography styles
  title: typography.title as TextStyle,
  subtitle: typography.subtitle,
  body: typography.body,
  caption: typography.caption,
  
  // Button styles
  buttonPrimary: buttons.primary as ViewStyle,
  buttonSecondary: buttons.secondary  as ViewStyle,
  buttonText: buttons.text  as TextStyle,
  
  // Input styles
  inputContainer: inputs.container,
  input: inputs.text,
  
  // Custom styles for specific components
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceContainer: {
    ...layout.card,
    alignItems: 'center',
  },
  balanceAmount: {
    ...typography.title,
    fontSize: 32,
  } as TextStyle,
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tokenItem: {
    ...layout.row,
    justifyContent: 'space-between',
    marginBottom: 12,
  } as ViewStyle,
  tokenIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 20,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  separator: {
    height: 1,
    backgroundColor: colors.secondary,
    marginVertical: 8,
  },
});

// Screen-specific styles
export const convertStyles = StyleSheet.create({
  mnemonicFrame: {
    ...layout.card,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  wordContainer: {
    backgroundColor: colors.secondary,
    padding: 12,
    margin: 8,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
});

export const passcodeStyles = StyleSheet.create({
  passcodeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  passcodeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.text.primary,
    marginHorizontal: 8,
  },
  passcodeCircleFilled: {
    backgroundColor: colors.text.primary,
  },
});

export const transferStyles = StyleSheet.create({
  amountContainer: {
    ...layout.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '25%',
  },
  tokenPickerButton: {
    ...layout.row,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 8,
  } as ViewStyle,
});

export const walletHistoryStyles = StyleSheet.create({
  transactionContainer: {
    ...layout.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    ...layout.row,
    backgroundColor: colors.cardBackground,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  } as ViewStyle,
});

export const settingsStyles = StyleSheet.create({
  settingItem: {
    ...layout.row,
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  } as ViewStyle,
  logoutButton: {
    ...buttons.primary,
    backgroundColor: colors.status.error,
    marginTop: 32,
  } as ViewStyle,
});