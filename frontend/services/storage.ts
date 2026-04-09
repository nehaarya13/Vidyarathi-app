import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  // Token save/get
  saveToken: async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
    } catch (e) {
      console.error('Error saving token', e);
    }
  },
  getToken: async () => {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (e) {
      return null;
    }
  },

  // User save/get (Isi ka error aa raha tha)
  saveUser: async (user) => {
    try {
      await AsyncStorage.setItem('userData', typeof user === 'string' ? user : JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user', e);
    }
  },
  getUser: async () => {
    try {
      return await AsyncStorage.getItem('userData');
    } catch (e) {
      return null;
    }
  },

  // Sab saaf karne ke liye
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  },

  removeToken: async () => {
    await AsyncStorage.removeItem('userToken');
  }
};