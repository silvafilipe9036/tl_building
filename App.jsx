import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Building2, 
  Home, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import './App.css'

// Mock authentication state
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    // Mock login logic
    if (email && password) {
      setIsAuthenticated(true)
      setUser({
        id: '1',
        name: 'João Silva',
        email: email,
        role: 'OWNER'
      })
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  return { isAuthenticated, user, login, logout }
}

// Login Component
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const success = onLogin(email, password)
      if (!success) {
        alert('Credenciais inválidas')
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">TL Building System</CardTitle>
          <CardDescription>
            Sistema de Gestão Imobiliária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Demo: use qualquer email e senha</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sidebar Component
const Sidebar = ({ isOpen, onClose, user, onLogout }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Building2, label: 'Imóveis', path: '/properties' },
    { icon: Users, label: 'Usuários', path: '/users' },
    { icon: FileText, label: 'Contratos', path: '/contracts' },
    { icon: CreditCard, label: 'Pagamentos', path: '/payments' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-lg">TL Building</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  // Handle navigation
                  onClose()
                }}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </>
  )
}

// Header Component
const Header = ({ onMenuClick, user }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Bem-vindo, {user?.name}
          </span>
        </div>
      </div>
    </header>
  )
}

// Dashboard Component
const Dashboard = () => {
  const stats = [
    { title: 'Total de Imóveis', value: '24', change: '+2 este mês' },
    { title: 'Contratos Ativos', value: '18', change: '+3 este mês' },
    { title: 'Receita Mensal', value: 'R$ 45.600', change: '+12% vs mês anterior' },
    { title: 'Taxa de Ocupação', value: '92%', change: '+5% vs mês anterior' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do seu portfólio imobiliário
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo contrato assinado</p>
                  <p className="text-xs text-muted-foreground">Apartamento 101 - Rua das Flores</p>
                </div>
                <span className="text-xs text-muted-foreground">2h atrás</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pagamento recebido</p>
                  <p className="text-xs text-muted-foreground">R$ 2.500,00 - João Silva</p>
                </div>
                <span className="text-xs text-muted-foreground">4h atrás</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Manutenção agendada</p>
                  <p className="text-xs text-muted-foreground">Casa 205 - Rua dos Pinheiros</p>
                </div>
                <span className="text-xs text-muted-foreground">1d atrás</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Contrato vence em 5 dias</p>
                  <p className="text-xs text-muted-foreground">Apartamento 302 - Maria Santos</p>
                </div>
                <Button size="sm" variant="outline">
                  Renovar
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Pagamento em atraso</p>
                  <p className="text-xs text-muted-foreground">R$ 1.800,00 - Pedro Costa</p>
                </div>
                <Button size="sm" variant="outline">
                  Cobrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={logout}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header 
            onMenuClick={() => setSidebarOpen(true)}
            user={user}
          />
          
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/properties" element={<div className="p-6">Imóveis - Em desenvolvimento</div>} />
              <Route path="/users" element={<div className="p-6">Usuários - Em desenvolvimento</div>} />
              <Route path="/contracts" element={<div className="p-6">Contratos - Em desenvolvimento</div>} />
              <Route path="/payments" element={<div className="p-6">Pagamentos - Em desenvolvimento</div>} />
              <Route path="/reports" element={<div className="p-6">Relatórios - Em desenvolvimento</div>} />
              <Route path="/settings" element={<div className="p-6">Configurações - Em desenvolvimento</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App

