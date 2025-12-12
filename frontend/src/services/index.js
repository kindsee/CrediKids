import apiClient from './api'

export const authService = {
  login: async (iconCodes) => {
    const response = await apiClient.post('/auth/login', {
      icon_codes: iconCodes
    })
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
  
  changePin: async (oldIconCodes, newIconCodes) => {
    const response = await apiClient.post('/auth/change-pin', {
      old_icon_codes: oldIconCodes,
      new_icon_codes: newIconCodes
    })
    return response.data
  },
  
  refreshUser: async () => {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  }
}

export const usersService = {
  getUsers: async () => {
    const response = await apiClient.get('/users')
    return response.data
  },
  
  getUser: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`)
    return response.data
  },
  
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData)
    return response.data
  },
  
  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}`, userData)
    return response.data
  },
  
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`)
    return response.data
  },
  
  getUserHistory: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/history`)
    return response.data
  }
}

export const tasksService = {
  getTasks: async () => {
    const response = await apiClient.get('/tasks')
    return response.data
  },
  
  getTask: async (taskId) => {
    const response = await apiClient.get(`/tasks/${taskId}`)
    return response.data
  },
  
  createTask: async (taskData) => {
    const response = await apiClient.post('/tasks', taskData)
    return response.data
  },
  
  updateTask: async (taskId, taskData) => {
    const response = await apiClient.put(`/tasks/${taskId}`, taskData)
    return response.data
  },
  
  deleteTask: async (taskId) => {
    const response = await apiClient.delete(`/tasks/${taskId}`)
    return response.data
  },
  
  assignTask: async (assignmentData) => {
    const response = await apiClient.post('/tasks/assign', assignmentData)
    return response.data
  },
  
  completeTask: async (assignmentId) => {
    const response = await apiClient.post(`/tasks/assignments/${assignmentId}/complete`)
    return response.data
  },
  
  validateTask: async (completionId, validationData) => {
    const response = await apiClient.post(`/tasks/completions/${completionId}/validate`, validationData)
    return response.data
  },
  
  getProposals: async () => {
    const response = await apiClient.get('/tasks/proposals')
    return response.data
  },
  
  createProposal: async (proposalData) => {
    const response = await apiClient.post('/tasks/proposals', proposalData)
    return response.data
  },
  
  reviewProposal: async (proposalId, reviewData) => {
    const response = await apiClient.post(`/tasks/proposals/${proposalId}/review`, reviewData)
    return response.data
  }
}

export const rewardsService = {
  getRewards: async () => {
    const response = await apiClient.get('/rewards')
    return response.data
  },
  
  getReward: async (rewardId) => {
    const response = await apiClient.get(`/rewards/${rewardId}`)
    return response.data
  },
  
  createReward: async (rewardData) => {
    const response = await apiClient.post('/rewards', rewardData)
    return response.data
  },
  
  updateReward: async (rewardId, rewardData) => {
    const response = await apiClient.put(`/rewards/${rewardId}`, rewardData)
    return response.data
  },
  
  deleteReward: async (rewardId) => {
    const response = await apiClient.delete(`/rewards/${rewardId}`)
    return response.data
  },
  
  redeemReward: async (rewardId, notes = '') => {
    const response = await apiClient.post(`/rewards/${rewardId}/redeem`, { notes })
    return response.data
  },
  
  getRedemptions: async () => {
    const response = await apiClient.get('/rewards/redemptions')
    return response.data
  }
}

export const calendarService = {
  getUserCalendar: async (userId, startDate, endDate, view = 'month') => {
    const response = await apiClient.get(`/calendar/user/${userId}`, {
      params: { start_date: startDate, end_date: endDate, view }
    })
    return response.data
  },
  
  getUserDay: async (userId, date) => {
    const response = await apiClient.get(`/calendar/user/${userId}/day/${date}`)
    return response.data
  },
  
  getUserPendingTasks: async (userId) => {
    const response = await apiClient.get(`/calendar/user/${userId}/pending`)
    return response.data
  },
  
  getUserCompletedTasks: async (userId, limit = 100) => {
    const response = await apiClient.get(`/calendar/user/${userId}/completed`, {
      params: { limit }
    })
    return response.data
  }
}

export const iconsService = {
  getIcons: async () => {
    const response = await apiClient.get('/icons')
    return response.data
  },
  
  seedIcons: async () => {
    const response = await apiClient.post('/icons/seed')
    return response.data
  }
}
