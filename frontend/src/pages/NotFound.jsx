import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className='main-container'>
      <div
        className='container'
        style={{
          gridTemplateColumns: '1fr',
          padding: '48px 32px',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <h1 style={{ fontSize: 'clamp(2.4rem, 8vw, 4rem)', fontWeight: 800 }}>
          404
        </h1>
        <p style={{ color: 'var(--auth-muted, #5b6472)', fontSize: '1rem' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div>
          <Link
            to='/admin/dashboard'
            style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '12px 22px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #c05621, #ea580c)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
