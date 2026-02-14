import Cookies from 'universal-cookie';

const cookies = new Cookies();

export class CookieStorage {
  setItem(key, value) {
    cookies.set(key, value, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    });
  }

  getItem(key) {
    return cookies.get(key);
  }

  removeItem(key) {
    cookies.remove(key, { path: '/' });
  }

  clear() {
    const allCookies = cookies.getAll();
    Object.keys(allCookies).forEach(key => {
      if (key.startsWith('CognitoIdentityServiceProvider')) {
        cookies.remove(key, { path: '/' });
      }
    });
  }
}

export const cookieStorage = new CookieStorage();
