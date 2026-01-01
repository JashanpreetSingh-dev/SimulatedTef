/**
 * Clerk theme configuration matching app's theme (light/dark)
 */
export const getClerkAppearance = (theme: 'light' | 'dark') => ({
  baseTheme: theme === 'dark' ? 'dark' : undefined,
  variables: {
    colorPrimary: theme === 'dark' ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
    colorBackground: theme === 'dark' ? '#1e293b' : '#ffffff', // slate-800 : white
    colorInputBackground: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
    colorInputText: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
    colorText: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
    colorTextSecondary: theme === 'dark' ? '#cbd5e1' : '#475569', // slate-300 : slate-600
    borderRadius: '1rem',
    fontFamily: 'Inter, sans-serif',
  },
  elements: {
    rootBox: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    card: {
      borderRadius: '2rem',
      boxShadow: theme === 'dark' 
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', // slate-800 : white
    },
    headerTitle: {
      fontWeight: '900',
      letterSpacing: '-0.025em',
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
      fontSize: '1.5rem',
    },
    headerSubtitle: {
      color: theme === 'dark' ? '#94a3b8' : '#64748b', // slate-400 : slate-500
      fontSize: '0.875rem',
    },
    socialButtonsBlockButton: {
      borderRadius: '1rem',
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#475569' : '#f1f5f9', // slate-600 : slate-100
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    socialButtonsBlockButtonText: {
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
    },
    formButtonPrimary: {
      borderRadius: '1rem',
      textTransform: 'uppercase',
      fontWeight: '800',
      letterSpacing: '0.05em',
      fontSize: '0.75rem',
      backgroundColor: theme === 'dark' ? '#6366f1' : '#6366f1', // indigo-500
      color: '#ffffff !important',
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#818cf8' : '#4f46e5', // indigo-400 : indigo-600
        color: '#ffffff !important',
      },
    },
    formButtonSecondary: {
      borderRadius: '1rem',
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#475569' : '#f1f5f9', // slate-600 : slate-100
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    button: {
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
    },
    buttonPrimary: {
      backgroundColor: theme === 'dark' ? '#6366f1' : '#6366f1', // indigo-500
      color: '#ffffff !important',
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#818cf8' : '#4f46e5', // indigo-400 : indigo-600
        color: '#ffffff !important',
      },
    },
    buttonSecondary: {
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      '&:hover': {
        backgroundColor: theme === 'dark' ? '#475569' : '#f1f5f9', // slate-600 : slate-100
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    formFieldInput: {
      borderRadius: '0.75rem',
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
      '&::placeholder': {
        color: theme === 'dark' ? '#94a3b8 !important' : '#94a3b8 !important', // slate-400
      },
      '&:focus': {
        borderColor: theme === 'dark' ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
        boxShadow: theme === 'dark' 
          ? '0 0 0 3px rgba(129, 140, 248, 0.2)'
          : '0 0 0 3px rgba(99, 102, 241, 0.1)',
        color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important',
      },
    },
    formFieldLabel: {
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
      fontWeight: '600',
      fontSize: '0.875rem',
    },
    formFieldSuccessText: {
      color: theme === 'dark' ? '#86efac !important' : '#22c55e !important', // emerald-400 : emerald-500
    },
    formFieldErrorText: {
      color: theme === 'dark' ? '#f87171 !important' : '#ef4444 !important', // red-400 : red-500
    },
    footerActionLink: {
      color: theme === 'dark' ? '#818cf8 !important' : '#6366f1 !important', // indigo-400 : indigo-500
      fontWeight: '600',
      '&:hover': {
        color: theme === 'dark' ? '#a5b4fc !important' : '#4f46e5 !important', // indigo-300 : indigo-600
      },
    },
    footerPages: {
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
    },
    identityPreviewText: {
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a', // slate-100 : slate-900
    },
    identityPreviewEditButton: {
      color: theme === 'dark' ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
    },
    alertText: {
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
    },
    alert: {
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      color: theme === 'dark' ? '#cbd5e1 !important' : '#475569 !important', // slate-300 : slate-600
    },
    formResendCodeLink: {
      color: theme === 'dark' ? '#818cf8 !important' : '#6366f1 !important', // indigo-400 : indigo-500
      '&:hover': {
        color: theme === 'dark' ? '#a5b4fc !important' : '#4f46e5 !important', // indigo-300 : indigo-600
      },
    },
    otpCodeFieldInput: {
      backgroundColor: theme === 'dark' ? '#334155' : '#f8fafc', // slate-700 : slate-50
      border: theme === 'dark' 
        ? '1px solid rgba(51, 65, 85, 0.8)' 
        : '1px solid rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
      color: theme === 'dark' ? '#f1f5f9 !important' : '#0f172a !important', // slate-100 : slate-900
    },
    dividerLine: {
      backgroundColor: theme === 'dark' 
        ? 'rgba(51, 65, 85, 0.8)' 
        : 'rgba(226, 232, 240, 0.8)', // slate-700 : slate-200
    },
    dividerText: {
      color: theme === 'dark' ? '#64748b' : '#94a3b8', // slate-500 : slate-400
    },
  },
});
