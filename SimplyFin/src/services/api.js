const API_URL = 'http://localhost:8000';

// Helper to get token from localStorage
const getAuthToken = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.access_token;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    return !!userData.access_token;
  } catch {
    return false;
  }
};

// Helper to handle 401 errors and redirect to login
const handle401Error = () => {
  console.log('Sesja wygasła lub token jest nieprawidłowy - wylogowanie');
  alert('Twoja sesja wygasła. Zostaniesz przekierowany do strony logowania.');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Enhanced fetch wrapper with automatic token validation and error handling
const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  // If no token and this is a protected endpoint, redirect to login
  if (!token && !url.includes('/login') && !url.includes('/register')) {
    handle401Error();
    throw new Error('Brak tokena uwierzytelniającego');
  }

  // Add authorization header if token exists
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      handle401Error();
      throw new Error('Sesja wygasła');
    }

    return response;
  } catch (error) {
    // If it's a network error and not our custom error, just throw it
    if (error.message !== 'Sesja wygasła' && error.message !== 'Brak tokena uwierzytelniającego') {
      throw error;
    }
    throw error;
  }
};

// Logout function - properly clears everything
export const logoutUser = () => {
  localStorage.removeItem('user');
  window.location.href = '/';
};

// --- Auth APIs ---

export const registerUser = async (email, password, nickname) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, nickname }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Rejestracja się nie powiodła');
    }

    return response.json();
  } catch (error) {
    console.error('Błąd rejestracji:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Logowanie się nie powiodło');
    }

    const data = await response.json();
    
    // Store user info and token
    localStorage.setItem('user', JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Błąd logowania:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/me`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać informacji o użytkowniku');
    }

    return response.json();
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

// --- Account Members APIs ---

export const getAccountMembers = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-members`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać listy członków konta');
    }

    return response.json();
  } catch (error) {
    console.error('Get account members error:', error);
    throw error;
  }
};

export const createAccountMember = async (nickname) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nickname }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się utworzyć członka konta');
    }

    return response.json();
  } catch (error) {
    console.error('Create account member error:', error);
    throw error;
  }
};

export const updateAccountMember = async (memberId, nickname) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nickname }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się zaktualizować członka konta');
    }

    return response.json();
  } catch (error) {
    console.error('Update account member error:', error);
    throw error;
  }
};

export const deleteAccountMember = async (memberId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-members/${memberId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Nie udało się dezaktywować członka konta');
    }

    return response.json();
  } catch (error) {
    console.error('Delete account member error:', error);
    throw error;
  }
};

// --- Account Types APIs ---

export const getAccountTypes = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-types`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać typów kont');
    }

    return response.json();
  } catch (error) {
    console.error('Get account types error:', error);
    throw error;
  }
};

export const createAccountType = async (name) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się utworzyć typu konta');
    }

    return response.json();
  } catch (error) {
    console.error('Create account type error:', error);
    throw error;
  }
};

export const updateAccountType = async (accountTypeId, name) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-types/${accountTypeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się zaktualizować typu konta');
    }

    return response.json();
  } catch (error) {
    console.error('Update account type error:', error);
    throw error;
  }
};

export const deleteAccountType = async (accountTypeId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/account-types/${accountTypeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się usunąć typu konta');
    }

    return response.json();
  } catch (error) {
    console.error('Delete account type error:', error);
    throw error;
  }
};

// --- Payment APIs ---

export const getRecentPayments = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payments/recent`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać listy płatności');
    }

    return response.json();
  } catch (error) {
    console.error('Get payments error:', error);
    throw error;
  }
};

export const getAllPayments = async (limit = null) => {
  try {
    const url = limit ? `${API_URL}/payments?limit=${limit}` : `${API_URL}/payments`;
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać listy płatności');
    }

    return response.json();
  } catch (error) {
    console.error('Get payments error:', error);
    throw error;
  }
};

export const createPayment = async (paymentData) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się utworzyć płatności');
    }

    return response.json();
  } catch (error) {
    console.error('Create payment error:', error);
    throw error;
  }
};

export const updatePayment = async (paymentId, paymentData) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się zaktualizować płatności');
    }

    return response.json();
  } catch (error) {
    console.error('Update payment error:', error);
    throw error;
  }
};

export const deletePayment = async (paymentId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payments/${paymentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Nie udało się usunąć płatności');
    }

    return response.json();
  } catch (error) {
    console.error('Delete payment error:', error);
    throw error;
  }
};

export const getExpenses = async (startDate = null, endDate = null, limit = null) => {
  try {
    let url = `${API_URL}/payments/expenses?`;
    if (startDate) url += `start_date=${startDate}&`;
    if (endDate) url += `end_date=${endDate}&`;
    if (limit) url += `limit=${limit}`;
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać wydatków');
    }

    return response.json();
  } catch (error) {
    console.error('Get expenses error:', error);
    throw error;
  }
};

export const getIncome = async (startDate = null, endDate = null, limit = null) => {
  try {
    let url = `${API_URL}/payments/income?`;
    if (startDate) url += `start_date=${startDate}&`;
    if (endDate) url += `end_date=${endDate}&`;
    if (limit) url += `limit=${limit}`;
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać przychodu');
    }

    return response.json();
  } catch (error) {
    console.error('Get income error:', error);
    throw error;
  }
};

export const getPaymentStats = async (days = 30) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payments/stats?days=${days}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać statystyk płatności');
    }

    return response.json();
  } catch (error) {
    console.error('Get payment stats error:', error);
    throw error;
  }
};

export const getMonthlyStats = async (months = 6) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payments/monthly-stats?months=${months}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać miesięcznych statystyk');
    }

    return response.json();
  } catch (error) {
    console.error('Get monthly stats error:', error);
    throw error;
  }
};

export const getStatsWithComparison = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payments/stats-with-comparison`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać statystyk z porównaniem');
    }

    return response.json();
  } catch (error) {
    console.error('Get stats with comparison error:', error);
    throw error;
  }
};

// --- Category Limits APIs ---

export const getCategoryLimits = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/category-limits`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać limitów kategorii');
    }

    return response.json();
  } catch (error) {
    console.error('Get category limits error:', error);
    throw error;
  }
};

export const createCategoryLimit = async (category, limitAmount) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/category-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, limit_amount: limitAmount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się utworzyć limitu kategorii');
    }

    return response.json();
  } catch (error) {
    console.error('Create category limit error:', error);
    throw error;
  }
};

export const updateCategoryLimit = async (limitId, limitAmount) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/category-limits/${limitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit_amount: limitAmount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się zaktualizować limitu kategorii');
    }

    return response.json();
  } catch (error) {
    console.error('Update category limit error:', error);
    throw error;
  }
};

export const deleteCategoryLimit = async (limitId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/category-limits/${limitId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się usunąć limitu kategorii');
    }

    return response.json();
  } catch (error) {
    console.error('Delete category limit error:', error);
    throw error;
  }
};



// --- Payment Suggestions APIs ---

export const getPaymentSuggestions = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payment-suggestions`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać sugestii płatności');
    }

    return response.json();
  } catch (error) {
    console.error('Get payment suggestions error:', error);
    throw error;
  }
};

export const acceptPaymentSuggestion = async (suggestionId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payment-suggestions/${suggestionId}/accept`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się zaakceptować sugestii');
    }

    return response.json();
  } catch (error) {
    console.error('Accept suggestion error:', error);
    throw error;
  }
};

export const dismissPaymentSuggestion = async (suggestionId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/payment-suggestions/${suggestionId}/dismiss`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się odrzucić sugestii');
    }

    return response.json();
  } catch (error) {
    console.error('Dismiss suggestion error:', error);
    throw error;
  }
};
// --- Savings Account APIs ---

export const getSavingsAccounts = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-accounts`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać kont oszczędnościowych');
    }

    return response.json();
  } catch (error) {
    console.error('Get savings accounts error:', error);
    throw error;
  }
};

export const createSavingsAccount = async (accountData) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się utworzyć konta oszczędnościowego');
    }

    return response.json();
  } catch (error) {
    console.error('Create savings account error:', error);
    throw error;
  }
};

export const updateSavingsAccount = async (accountId, accountData) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-accounts/${accountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się zaktualizować konta oszczędnościowego');
    }

    return response.json();
  } catch (error) {
    console.error('Update savings account error:', error);
    throw error;
  }
};

export const deleteSavingsAccount = async (accountId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-accounts/${accountId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się usunąć konta oszczędnościowego');
    }

    return response.json();
  } catch (error) {
    console.error('Delete savings account error:', error);
    throw error;
  }
};

// --- Savings Goal APIs ---

export const getSavingsGoals = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-goals`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać celów oszczędzania');
    }

    return response.json();
  } catch (error) {
    console.error('Get savings goals error:', error);
    throw error;
  }
};

export const createSavingsGoal = async (goalData) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goalData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się utworzyć celu oszczędzania');
    }

    return response.json();
  } catch (error) {
    console.error('Create savings goal error:', error);
    throw error;
  }
};

export const updateSavingsGoal = async (goalId, goalData) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goalData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się zaktualizować celu oszczędzania');
    }

    return response.json();
  } catch (error) {
    console.error('Update savings goal error:', error);
    throw error;
  }
};

export const deleteSavingsGoal = async (goalId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-goals/${goalId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się usunąć celu oszczędzania');
    }

    return response.json();
  } catch (error) {
    console.error('Delete savings goal error:', error);
    throw error;
  }
};

// --- Savings Deposit APIs ---

export const getSavingsDeposits = async (goalId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-goals/${goalId}/deposits`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać wpłat oszczędnościowych');
    }

    return response.json();
  } catch (error) {
    console.error('Get savings deposits error:', error);
    throw error;
  }
};

export const createSavingsDeposit = async (depositData) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(depositData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się utworzyć wpłaty oszczędnościowej');
    }

    return response.json();
  } catch (error) {
    console.error('Create savings deposit error:', error);
    throw error;
  }
};

export const deleteSavingsDeposit = async (depositId) => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-deposits/${depositId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nie udało się usunąć wpłaty oszczędnościowej');
    }

    return response.json();
  } catch (error) {
    console.error('Delete savings deposit error:', error);
    throw error;
  }
};

// --- Savings Stats API ---

export const getSavingsStats = async () => {
  try {
    const response = await authenticatedFetch(`${API_URL}/savings-stats`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać statystyk oszczędzania');
    }

    return response.json();
  } catch (error) {
    console.error('Get savings stats error:', error);
    throw error;
  }
};