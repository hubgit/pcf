import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  typography: {
    fontFamily: 'Roboto,"Helvetica Neue",Helvetica,Arial,sans-serif;',
    h2: {
      fontSize: '150%',
      fontWeight: 'bold',
      marginBottom: 16,
    },
    h3: {
      fontSize: '120%',
      fontWeight: 'bold',
    },
  },
  components: {
    MuiFormGroup: {
      root: {
        flexDirection: 'row',
      },
    },
  },
})
