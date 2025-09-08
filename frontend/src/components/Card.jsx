export function Card({ children }) {
  return <div className='bg-white rounded-xl shadow p-4'>{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}
