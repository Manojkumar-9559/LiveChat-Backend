const passport = require('passport');
const dotenv = require('dotenv');
const User = require('../models/UserModel');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

dotenv.config();

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:4000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const existingUser = await User.findOne({ googleId: profile.id });
                if (existingUser) return done(null, existingUser);

                const newUser = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value,
                    profilePic: profile.photos?.[0]?.value,
                });

                return done(null, newUser);
            } catch (error) {
                console.error("Error in Google OAuth:", error);
                return done(error, null);
            }
        }
    )
);

// GitHub OAuth Strategy
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: "http://localhost:4000/auth/gitHub/callback",           
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const existingUser = await User.findOne({ googleId: profile.id });
                if (existingUser) return done(null, existingUser);

                const newUser = await User.create({
                    googleId: profile.id,
                    name: profile.username,
                    email: profile.emails?.[0]?.value || 'N/A',
                    profilePic: profile.photos?.[0]?.value || '',
                });

                
                return done(null, newUser);
            } catch (error) {
                console.error("Error in GitHub OAuth:", error);
                return done(error, null);
            }
        }
    )
);

// Serialize & Deserialize user
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
