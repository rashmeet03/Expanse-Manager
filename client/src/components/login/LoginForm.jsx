import * as Yup from 'yup';
import { useState } from 'react';
import { useFormik, Form, FormikProvider } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
// material
import {
    Stack,
    TextField,
    IconButton,
    InputAdornment,
    Snackbar,
    Alert,
    FormControlLabel,
    Checkbox,
    Button,
    Divider,
    Chip,
    Box
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
// component
import Iconify from '../Iconify';
import axios from 'axios';

import useResponsive from '../../theme/hooks/useResponsive';
import configData from '../../config.json';

export default function LoginForm() {
    const smUp = useResponsive('up', 'sm');
    const navigate = useNavigate();

    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);

    const LoginSchema = Yup.object().shape({
        emailId: Yup.string().email('Email must be a valid email address').required('Email is required'),
        password: Yup.string().required('Password is required'),
    });

    const formik = useFormik({
        initialValues: {
            emailId: localStorage.getItem('rememberedEmail') || '',
            password: '',
            remember: localStorage.getItem('rememberedEmail') ? true : false,
        },
        validationSchema: LoginSchema,
        onSubmit: async (values) => {
            try {
                const response = await axios.post('/api/users/v1/login', {
                    emailId: values.emailId,
                    password: values.password,
                    rememberMe: values.remember
                });

                // Store token and user data
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('profile', JSON.stringify({
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    emailId: response.data.emailId,
                    userId: response.data.userId,
                    accessToken: response.data.accessToken
                }));

                // Handle remember me
                if (values.remember) {
                    localStorage.setItem('rememberedEmail', values.emailId);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                navigate(configData.DASHBOARD_URL);
            } catch (error) {
                setAlertMessage(error.response?.data?.message || 'Login failed');
                setShowAlert(true);
            }
        },
    });

    const handleDemoLogin = async () => {
        setDemoLoading(true);
        try {
            const response = await axios.post('/api/users/v1/demo-login');

            // Store token and user data
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('profile', JSON.stringify({
                firstName: response.data.firstName,
                lastName: response.data.lastName,
                emailId: response.data.emailId,
                userId: response.data.userId,
                accessToken: response.data.accessToken,
                isDemo: true
            }));

            navigate(configData.DASHBOARD_URL);
        } catch (error) {
            setAlertMessage('Demo login failed');
            setShowAlert(true);
        } finally {
            setDemoLoading(false);
        }
    };

    const { errors, touched, values, isSubmitting, handleSubmit, getFieldProps } = formik;

    const handleShowPassword = () => {
        setShowPassword((show) => !show);
    };

    return (
        <>
            <Snackbar
                open={showAlert}
                autoHideDuration={6000}
                onClose={() => setShowAlert(false)}
            >
                <Alert severity="error" onClose={() => setShowAlert(false)}>
                    {alertMessage}
                </Alert>
            </Snackbar>

            <FormikProvider value={formik}>
                <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
                    {smUp && showAlert && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {alertMessage}
                        </Alert>
                    )}

                    {/* Demo Button */}
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleDemoLogin}
                        disabled={demoLoading || isSubmitting}
                        sx={{
                            mb: 2,
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            '&:hover': {
                                borderColor: '#f57c00',
                                backgroundColor: '#fff3e0'
                            }
                        }}
                    >
                        {demoLoading ? <Iconify icon="eos-icons:loading" width={24} height={24} /> : '🚀 Try Demo (No Signup Required)'}
                    </Button>

                    <Divider sx={{ my: 2 }}>
                        <Chip label="OR" size="small" />
                    </Divider>

                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            autoComplete="username"
                            type="email"
                            label="Email address"
                            {...getFieldProps('emailId')}
                            error={Boolean(touched.emailId && errors.emailId)}
                            helperText={touched.emailId && errors.emailId}
                        />

                        <TextField
                            fullWidth
                            autoComplete="current-password"
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            {...getFieldProps('password')}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleShowPassword} edge="end">
                                            <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            error={Boolean(touched.password && errors.password)}
                            helperText={touched.password && errors.password}
                        />
                    </Stack>

                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 2 }}>
                        <FormControlLabel
                            control={<Checkbox {...getFieldProps('remember')} checked={values.remember} />}
                            label="Remember me"
                        />
                        <Link to="/forgot-password">
                            Forgot password?
                        </Link>
                    </Stack>

                    <LoadingButton
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        loading={isSubmitting}
                    >
                        Login
                    </LoadingButton>
                </Form>
            </FormikProvider>
        </>
    );
}
