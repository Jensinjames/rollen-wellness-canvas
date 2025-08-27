import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const DebugAuthTest = () => {
  const [email, setEmail] = useState('rollencole2@gmail.com');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDirectAuth = async () => {
    setLoading(true);
    setResult('Testing direct Supabase authentication...');
    
    try {
      console.log('🧪 Testing direct supabase.auth.signInWithPassword');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password.length);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      console.log('📦 Full response data:', data);
      console.log('❗ Full error:', error);
      
      if (error) {
        setResult(`❌ Direct auth failed: ${error.message}`);
        console.error('Direct auth error details:', {
          name: error.name,
          message: error.message,
          status: (error as any).status,
          details: (error as any)
        });
      } else if (data.user) {
        setResult(`✅ Direct auth SUCCESS! User: ${data.user.email}`);
        console.log('✅ User data:', data.user);
        console.log('🎫 Session data:', data.session);
      } else {
        setResult('⚠️ No error but no user returned');
      }
    } catch (err) {
      console.error('💥 Caught exception:', err);
      setResult(`💥 Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testExistingUsers = async () => {
    setLoading(true);
    setResult('Testing with known existing users...');
    
    const testUsers = [
      'rollencole2@gmail.com',
      'jensin@thepreeminent.com'
    ];
    
    for (const testEmail of testUsers) {
      try {
        console.log(`🧪 Testing user: ${testEmail}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: 'testpassword123' // Common test password
        });
        
        if (error) {
          console.log(`❌ ${testEmail}: ${error.message}`);
          setResult(prev => prev + `\n❌ ${testEmail}: ${error.message}`);
        } else {
          console.log(`✅ ${testEmail}: Success!`);
          setResult(prev => prev + `\n✅ ${testEmail}: Success!`);
          break; // Stop on first success
        }
      } catch (err) {
        console.log(`💥 ${testEmail}: Exception - ${err}`);
        setResult(prev => prev + `\n💥 ${testEmail}: Exception - ${err}`);
      }
    }
    
    setLoading(false);
  };

  const checkSupabaseConnection = async () => {
    setLoading(true);
    setResult('Checking Supabase connection...');
    
    try {
      console.log('🔌 Testing Supabase connection');
      console.log('🔗 Testing with configured Supabase client');
      
      // Test a simple query to verify connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setResult(`❌ Connection test failed: ${error.message}`);
      } else {
        setResult(`✅ Connection successful. Current session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (err) {
      setResult(`💥 Connection exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔧 Debug Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={testDirectAuth} 
            disabled={loading || !email || !password}
            className="w-full"
          >
            Test Direct Auth
          </Button>
          
          <Button 
            onClick={testExistingUsers} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Test Known Users
          </Button>
          
          <Button 
            onClick={checkSupabaseConnection} 
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            Check Connection
          </Button>
        </div>
        
        {result && (
          <div className="mt-4 p-3 bg-muted rounded text-sm whitespace-pre-wrap font-mono">
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
};