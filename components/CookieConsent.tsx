import React from 'react';

const CookieConsent: React.FC<any> = () => {
    console.error('[CRITICAL DEBUG] CookieConsent RENDERED AT TOP LEVEL');
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                backgroundColor: 'yellow',
                color: 'black',
                padding: '40px',
                zIndex: 99999999,
                border: '10px solid red',
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 'bold'
            }}
        >
            DEBUG: JEŚLI TO WIDZISZ, KLIKNIJ TUTAJ ->
            <button
                onClick={() => {
                    localStorage.setItem('cookieConsent', 'true');
                    window.location.reload();
                }}
                style={{ backgroundColor: 'black', color: 'white', padding: '10px 20px', marginLeft: '20px' }}
            >
                AKCEPTUJĘ (RESTART)
            </button>
        </div>
    );
};

export default CookieConsent;
