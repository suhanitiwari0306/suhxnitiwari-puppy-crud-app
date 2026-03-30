import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton
} from '@asgardeo/react';

const Header = () => {
  return (
    <header className="header">
      <h1>Puppy Management App</h1>

      <div>
        <SignedOut>
          <SignInButton />
        </SignedOut>

        <SignedIn>
          <SignOutButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;