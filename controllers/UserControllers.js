const passport = require('passport');

// Redirects user to Google for authentication
const goToGoogleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// Redirects user to GitHub for authentication
const goToGitHubAuth = passport.authenticate('github', { scope: ['user:email'] });

// Handles Google OAuth callback logic with success redirect
const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', (err, user) => {
        if (err || !user) {
            return res.redirect('/auth/logout');
        }

        // Send user details to frontend as query params
        const redirectURL = `http://localhost:3000/home?username=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&profilePic=${encodeURIComponent(user.profilePic)}`;
        res.redirect(redirectURL);
    })(req, res, next);
};

// Handles GitHub OAuth callback logic with success redirect
const gitHubAuthCallback = (req, res, next) => {
    passport.authenticate('github', (err, user) => {
        if (err || !user) {
            return res.redirect('/auth/logout');
        }

        // Send user details to frontend as query params
        const redirectURL = `http://localhost:3000/home?username=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&profilePic=${encodeURIComponent(user.profilePic)}`;
        res.redirect(redirectURL);
    })(req, res, next);
};

// Logout endpoint
const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout Error:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }

        req.session.destroy(() => {
            res.redirect('http://localhost:3000'); // Redirect to landing page or login page
        });
    });
};

module.exports = {
    goToGoogleAuth,
    googleAuthCallback,
    goToGitHubAuth,
    gitHubAuthCallback,
    logout
};
