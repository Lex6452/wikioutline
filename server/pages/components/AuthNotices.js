// @flow
import * as React from 'react';
import Notice from '../../../shared/components/Notice';

type Props = {
  notice?: string,
};

export default function AuthNotices({ notice }: Props) {
  return (
    <React.Fragment>
      {notice === 'guest-success' && (
        <Notice>
          A magic sign-in link has been sent to your email address, no password
          needed.
        </Notice>
      )}
      {notice === 'google-hd' && (
        <Notice>
          Sorry, Google sign in cannot be used with a personal email. Please try
          signing in with your company Google account.
        </Notice>
      )}
      {notice === 'hd-not-allowed' && (
        <Notice>
          Sorry, your Google apps domain is not allowed. Please try again with
          an allowed company domain.
        </Notice>
      )}
      {notice === 'email-auth-required' && (
        <Notice>
          Your account uses email sign-in, please sign-in with email to
          continue.
        </Notice>
      )}
      {notice === 'auth-error' && (
        <Notice>
          Authentication failed - we were unable to sign you in at this time.
          Please try again.
        </Notice>
      )}
      {notice === 'suspended' && (
        <Notice>
          Your Outline account has been suspended. To re-activate your account,
          please contact a team admin.
        </Notice>
      )}
    </React.Fragment>
  );
}
