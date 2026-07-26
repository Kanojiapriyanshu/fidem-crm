// styles/reactSelectStyles.ts
export const rsStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: 'white',
    borderRadius: '.5rem',
    borderColor: state.isFocused ? '#FF7236' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 .5px #FF7236' : 'none',
    minHeight: '2.5rem',
    borderWidth: '2px',
    transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
    willChange: 'transform',
    ':hover': {
      ...base[':hover'],
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 18px rgba(0,0,0,0.06)',
      borderColor: '#FF7236',
    },
  }),

  menu: (base: any) => ({
    ...base,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    zIndex: 50,
    boxShadow: '0 16px 32px rgba(0,0,0,0.08)',
  }),

  option: (base: any, state: any) => {
    const gradient = 'linear-gradient(90deg, #FFBF00 0%, #FFDB58 100%)'; // from-[#FFBF00] to-[#FFDB58]
    const lifted = state.isFocused && !state.isDisabled;
    const isActive = state.isSelected || state.isFocused;

    return {
      ...base,
      // Use your gradient instead of white on focus/selected/hover
      background: isActive ? gradient : 'white',
      color: '#1F2937', // text-gray-800 (for both active and idle states)
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      transition:
        'transform 120ms ease, box-shadow 120ms ease, background 120ms ease, color 120ms ease',
      willChange: 'transform',
      transform: lifted ? 'translateY(-2px)' : 'translateY(0)',
      boxShadow: lifted ? '0 8px 14px rgba(0,0,0,0.06)' : 'none',
      ':active': {
        ...base[':active'],
        transform: 'translateY(-1px) scale(0.99)',
      },
    };
  },
};

export const rsTheme = (theme: any) => ({
  ...theme,
  borderRadius: 8,
  colors: {
    ...theme.colors,
    primary25: 'white',
    primary: '#FF7236',
  },
});
