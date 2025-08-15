import React from 'react';
import { CircularProgress, Grid, Typography, Paper, Box } from "@mui/material";

export default function Loading({ message = "Loading..." }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                p: 3
            }}
        >
            <Paper
                elevation={2}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2,
                    maxWidth: 400
                }}
            >
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                    <Grid item xs={12}>
                        <CircularProgress size={60} thickness={4} />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                            {message}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
