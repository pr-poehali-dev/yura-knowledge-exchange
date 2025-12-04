import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

type UserRole = 'passenger' | 'driver';
type OrderStatus = 'searching' | 'found' | 'accepted' | 'completed';

interface Order {
  id: string;
  from: string;
  to: string;
  status: OrderStatus;
  driverName?: string;
  carNumber?: string;
  arrivalTime?: number;
}

const Index = () => {
  const [role, setRole] = useState<UserRole>('passenger');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState<string>('order');

  const handleCreateOrder = () => {
    if (!from || !to) {
      toast({
        title: 'Ошибка',
        description: 'Заполните адреса',
        variant: 'destructive',
      });
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      from,
      to,
      status: 'searching',
    };

    setCurrentOrder(newOrder);
    setIncomingOrders([...incomingOrders, newOrder]);

    toast({
      title: '🚕 Ищем водителя',
      description: 'Подбираем ближайшее авто...',
    });

    setTimeout(() => {
      const updatedOrder = {
        ...newOrder,
        status: 'found' as OrderStatus,
        driverName: 'Иван Петров',
        carNumber: 'А777АА777',
        arrivalTime: 5,
      };
      setCurrentOrder(updatedOrder);
      toast({
        title: '✅ Водитель найден!',
        description: `${updatedOrder.driverName} • ${updatedOrder.carNumber}`,
      });
    }, 2000);
  };

  const handleAcceptOrder = (orderId: string) => {
    const order = incomingOrders.find((o) => o.id === orderId);
    if (order) {
      const acceptedOrder = {
        ...order,
        status: 'accepted' as OrderStatus,
        driverName: 'Вы',
        carNumber: 'В555ВВ555',
        arrivalTime: 3,
      };
      setIncomingOrders(incomingOrders.filter((o) => o.id !== orderId));
      toast({
        title: '✅ Заказ принят',
        description: `${order.from} → ${order.to}`,
      });
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setIncomingOrders(incomingOrders.filter((o) => o.id !== orderId));
    toast({
      title: 'Заказ отклонён',
      variant: 'destructive',
    });
  };

  const menuItems = [
    { id: 'order', label: 'Заказ', icon: 'Car' },
    { id: 'history', label: 'История', icon: 'History' },
    { id: 'profile', label: 'Профиль', icon: 'User' },
    { id: 'support', label: 'Поддержка', icon: 'MessageCircle' },
    { id: 'tariff', label: 'Тариф', icon: 'DollarSign' },
    { id: 'promo', label: 'Промокод', icon: 'Tag' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="pt-6 pb-4 animate-fade-in">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            TaxiGo
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Быстрое такси в один клик
          </p>
        </div>

        <div className="flex gap-2 justify-center animate-slide-up">
          <Button
            variant={role === 'passenger' ? 'default' : 'outline'}
            onClick={() => setRole('passenger')}
            className="flex-1"
          >
            <Icon name="User" className="mr-2" size={18} />
            Пассажир
          </Button>
          <Button
            variant={role === 'driver' ? 'default' : 'outline'}
            onClick={() => setRole('driver')}
            className="flex-1 bg-secondary hover:bg-secondary/90"
          >
            <Icon name="Car" className="mr-2" size={18} />
            Водитель
          </Button>
        </div>

        {role === 'passenger' && (
          <div className="space-y-4 animate-fade-in">
            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MapPin" className="text-primary" size={24} />
                  Новый заказ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icon name="Navigation" size={16} className="text-accent" />
                    Откуда
                  </label>
                  <Input
                    placeholder="Улица, дом"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icon name="MapPinned" size={16} className="text-secondary" />
                    Куда
                  </label>
                  <Input
                    placeholder="Улица, дом"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border-2"
                  />
                </div>
                <Button
                  onClick={handleCreateOrder}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6"
                  disabled={currentOrder?.status === 'searching'}
                >
                  {currentOrder?.status === 'searching' ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                      Поиск водителя...
                    </>
                  ) : (
                    <>
                      <Icon name="Search" className="mr-2" size={20} />
                      Найти такси
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {currentOrder && currentOrder.status === 'found' && (
              <Card className="shadow-lg border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon name="CheckCircle2" size={24} />
                    Водитель найден!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon name="User" size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{currentOrder.driverName}</p>
                        <p className="text-muted-foreground">{currentOrder.carNumber}</p>
                      </div>
                    </div>
                    <Badge className="bg-accent text-white px-4 py-2 text-base">
                      {currentOrder.arrivalTime} мин
                    </Badge>
                  </div>
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Icon name="Navigation" size={16} className="text-accent mt-0.5" />
                      <p className="text-muted-foreground">{currentOrder.from}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="MapPinned" size={16} className="text-secondary mt-0.5" />
                      <p className="text-muted-foreground">{currentOrder.to}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Меню</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 ${
                        activeSection === item.id
                          ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Icon
                        name={item.icon as any}
                        size={24}
                        className={activeSection === item.id ? 'text-primary' : 'text-muted-foreground'}
                      />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {role === 'driver' && (
          <div className="space-y-4 animate-fade-in">
            <Card className="shadow-lg border-2 border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Icon name="Bell" size={24} />
                  Входящие заказы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Пока нет новых заказов</p>
                  </div>
                ) : (
                  incomingOrders.map((order) => (
                    <Card key={order.id} className="bg-gradient-to-br from-secondary/5 to-accent/5">
                      <CardContent className="pt-6 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Icon name="Navigation" size={16} className="text-accent mt-1" />
                            <div>
                              <p className="text-xs text-muted-foreground">Откуда</p>
                              <p className="font-medium">{order.from}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="MapPinned" size={16} className="text-secondary mt-1" />
                            <div>
                              <p className="text-xs text-muted-foreground">Куда</p>
                              <p className="font-medium">{order.to}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="flex-1 bg-gradient-to-r from-secondary to-accent"
                          >
                            <Icon name="Check" className="mr-2" size={18} />
                            Принять
                          </Button>
                          <Button
                            onClick={() => handleRejectOrder(order.id)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Icon name="X" className="mr-2" size={18} />
                            Отказаться
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Меню водителя</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {menuItems.slice(1).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 ${
                        activeSection === item.id
                          ? 'bg-gradient-to-br from-secondary/20 to-accent/20 border-2 border-secondary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Icon
                        name={item.icon as any}
                        size={24}
                        className={activeSection === item.id ? 'text-secondary' : 'text-muted-foreground'}
                      />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
