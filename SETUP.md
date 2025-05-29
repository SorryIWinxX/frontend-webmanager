# Configuración del Login

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con la siguiente configuración:

```env
# Backend API Configuration
BACKEND_API_BASE_URL=http://localhost:3001
```

Cambia `http://localhost:3001` por la URL de tu backend.

## Funcionamiento del Login

El sistema de login funciona de la siguiente manera:

1. **Envío de credenciales**: Se envían `username` y `password` al endpoint `/master-users/login`
2. **Respuesta del backend**: El backend devuelve un objeto con `id`, `username` y `message`
3. **Almacenamiento**: El ID del usuario se guarda en localStorage para uso posterior
4. **Uso del ID**: El ID se puede usar para hacer peticiones relacionadas con avisos de mantenimiento

## Ejemplo de uso

```typescript
import { useCurrentUser } from '@/hooks/use-current-user';

function MyComponent() {
  const { userId, user, isLoggedIn } = useCurrentUser();
  
  if (isLoggedIn && userId) {
    // Usar el userId para hacer peticiones al backend
    console.log('User ID:', userId);
  }
}
```

## Utilidades disponibles

- `getCurrentUser()`: Obtiene el usuario actual
- `getCurrentUserId()`: Obtiene solo el ID del usuario
- `isLoggedIn()`: Verifica si hay un usuario logueado
- `useCurrentUser()`: Hook para usar en componentes React 