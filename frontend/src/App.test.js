import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';

test('renders the sign-in page at the default route for a logged-out user', async () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // App.js lazy-loads every route, so the sign-in form only appears once
  // that chunk resolves — findByRole waits for it instead of asserting
  // synchronously. Scoped to the heading to avoid matching the "Sign In"
  // submit button as well.
  const heading = await screen.findByRole(
    'heading',
    { name: /sign in/i },
    { timeout: 5000 }
  );
  expect(heading).toBeInTheDocument();
});

test('shows a 404 page for an unknown route', async () => {
  window.history.pushState({}, '', '/this-route-does-not-exist');

  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  const notFound = await screen.findByText(/404/i);
  expect(notFound).toBeInTheDocument();
});
