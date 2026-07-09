'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LogIn, LogOut, User, Shield, Clock } from 'lucide-react';

interface SessionUser {
  id: string;
  username: string;
  name: string;
  nameMarathi: string;
  role: string;
  isActive: boolean;
}

interface SessionData {
  authenticated: boolean;
  user?: SessionUser;
  loginAt?: string | null;
}

export default function LoginForm({ onLoginSuccess, onLogout }: { onLoginSuccess?: () => void; onLogout?: () => void }) {
  const [session, setSession] = useState<SessionData>({ authenticated: false });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setSession(data);
    } catch {
      setSession({ authenticated: false });
    }
  }, []);

  useEffect(() => {
    // Seed default users on mount
    const seedUsers = async () => {
      setSeeding(true);
      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed' }),
        });
      } catch {
        // ignore
      } finally {
        setSeeding(false);
      }
    };
    seedUsers();
    checkSession();
  }, [checkSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: 'त्रुटी', description: 'युजरनेम आणि पासवर्ड आवश्यक आहे', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'यशस्वी', description: `${data.nameMarathi || data.name} लॉगिन झाले` });
        setUsername('');
        setPassword('');
        checkSession();
        onLoginSuccess?.();
      } else {
        toast({ title: 'लॉगिन अयशस्वी', description: data.error || 'अवैध credentials', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'त्रुटी', description: 'लॉगिन अयशस्वी', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({ title: 'लॉगआउट', description: 'तुम्ही यशस्वीरित्या लॉगआउट झालात' });
      setSession({ authenticated: false });
      onLogout?.();
    } catch {
      toast({ title: 'त्रुटी', description: 'लॉगआउट अयशस्वी', variant: 'destructive' });
    }
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('mr-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (seeding) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="animate-pulse">डीफॉल्ट युजर तयार करत आहे...</div>
        </CardContent>
      </Card>
    );
  }

  if (session.authenticated && session.user) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            लॉगिन माहिती
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{session.user.nameMarathi || session.user.name}</span>
                <Badge
                  variant={session.user.role === 'gpo' ? 'default' : 'secondary'}
                  className={
                    session.user.role === 'gpo'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {session.user.role === 'gpo' ? 'GPO' : 'Operator'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                युजरनेम: {session.user.username}
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              लॉगआउट
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>लॉगिन वेळ: {formatTime(session.loginAt)}</span>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3">
            <div className="flex flex-col gap-1">
              <span>GPO: युजरनेम <code className="bg-muted px-1 rounded">gpo</code> / पासवर्ड <code className="bg-muted px-1 rounded">gpo123</code></span>
              <span>Operator: युजरनेम <code className="bg-muted px-1 rounded">operator</code> / पासवर्ड <code className="bg-muted px-1 rounded">op123</code></span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          लॉगिन करा
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">युजरनेम</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="युजरनेम टाका"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">पासवर्ड</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="पासवर्ड टाका"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="animate-pulse">लॉगिन करत आहे...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                लॉगिन
              </>
            )}
          </Button>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>GPO: <code className="bg-muted px-1 rounded">gpo</code> / <code className="bg-muted px-1 rounded">gpo123</code></p>
            <p>Operator: <code className="bg-muted px-1 rounded">operator</code> / <code className="bg-muted px-1 rounded">op123</code></p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
