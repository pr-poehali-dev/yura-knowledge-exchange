import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

type UserRole = 'passenger' | 'driver';
type OrderStatus = 'searching' | 'found' | 'accepted' | 'completed';
type TariffType = 'economy' | 'comfort' | 'business';

interface Order {
  id: string;
  from: string;
  to: string;
  status: OrderStatus;
  driverName?: string;
  carNumber?: string;
  arrivalTime?: number;
  tariff?: TariffType;
  price?: number;
  distance?: number;
  date?: string;
  time?: string;
  rating?: number;
  review?: string;
  driverRating?: number;
}

interface Tariff {
  id: TariffType;
  name: string;
  icon: string;
  basePrice: number;
  perKm: number;
  description: string;
}

const Index = () => {
  const [role, setRole] = useState<UserRole>('passenger');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const [tempRating, setTempRating] = useState(0);
  const [tempReview, setTempReview] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [activeSection, setActiveSection] = useState<string>('order');
  const [selectedTariff, setSelectedTariff] = useState<TariffType>('economy');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  const tariffs: Tariff[] = [
    {
      id: 'economy',
      name: 'Эконом',
      icon: 'Car',
      basePrice: 100,
      perKm: 15,
      description: 'Базовый тариф',
    },
    {
      id: 'comfort',
      name: 'Комфорт',
      icon: 'Sparkles',
      basePrice: 150,
      perKm: 25,
      description: 'Комфортные авто',
    },
    {
      id: 'business',
      name: 'Бизнес',
      icon: 'Crown',
      basePrice: 300,
      perKm: 45,
      description: 'Премиум класс',
    },
  ];

  const calculatePrice = (distance: number, tariff: TariffType): number => {
    const selectedTariffData = tariffs.find(t => t.id === tariff);
    if (!selectedTariffData) return 0;
    return selectedTariffData.basePrice + (distance * selectedTariffData.perKm);
  };

  const calculateEstimate = () => {
    if (!from || !to) return;
    const randomDistance = Math.floor(Math.random() * 20) + 3;
    const price = calculatePrice(randomDistance, selectedTariff);
    setEstimatedPrice(price);
    toast({
      title: '💰 Расчёт стоимости',
      description: `~${randomDistance} км • ${price} ₽`,
    });
  };

  const handleCreateOrder = () => {
    if (!from || !to) {
      toast({
        title: 'Ошибка',
        description: 'Заполните адреса',
        variant: 'destructive',
      });
      return;
    }

    const randomDistance = Math.floor(Math.random() * 20) + 3;
    const calculatedPrice = calculatePrice(randomDistance, selectedTariff);

    const now = new Date();
    const newOrder: Order = {
      id: Date.now().toString(),
      from,
      to,
      status: 'searching',
      tariff: selectedTariff,
      price: calculatedPrice,
      distance: randomDistance,
      date: now.toLocaleDateString('ru-RU'),
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    setCurrentOrder(newOrder);
    setIncomingOrders([...incomingOrders, newOrder]);

    toast({
      title: '🚕 Ищем водителя',
      description: 'Подбираем ближайшее авто...',
    });

    setTimeout(() => {
      const driverRating = (Math.random() * 2 + 3).toFixed(1);
      const updatedOrder = {
        ...newOrder,
        status: 'found' as OrderStatus,
        driverName: 'Иван Петров',
        carNumber: 'А777АА777',
        arrivalTime: 5,
        driverRating: parseFloat(driverRating),
      };
      setCurrentOrder(updatedOrder);
      
      const completedOrder = { ...updatedOrder, status: 'completed' as OrderStatus };
      setOrderHistory([completedOrder, ...orderHistory]);
      
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
        status: 'completed' as OrderStatus,
        driverName: 'Вы',
        carNumber: 'В555ВВ555',
        arrivalTime: 3,
      };
      setIncomingOrders(incomingOrders.filter((o) => o.id !== orderId));
      setOrderHistory([acceptedOrder, ...orderHistory]);
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

  const openRatingDialog = (order: Order) => {
    setSelectedOrderForRating(order);
    setTempRating(order.rating || 0);
    setTempReview(order.review || '');
    setRatingDialogOpen(true);
  };

  const submitRating = () => {
    if (!selectedOrderForRating) return;
    
    const updatedHistory = orderHistory.map(order => 
      order.id === selectedOrderForRating.id 
        ? { ...order, rating: tempRating, review: tempReview }
        : order
    );
    
    setOrderHistory(updatedHistory);
    setRatingDialogOpen(false);
    
    toast({
      title: '⭐ Спасибо за отзыв!',
      description: `Вы оценили поездку на ${tempRating} звёзд`,
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

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icon name="DollarSign" size={16} className="text-primary" />
                    Выберите тариф
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {tariffs.map((tariff) => (
                      <button
                        key={tariff.id}
                        onClick={() => setSelectedTariff(tariff.id)}
                        className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedTariff === tariff.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:border-primary/50'
                        }`}
                      >
                        <Icon
                          name={tariff.icon as any}
                          size={24}
                          className={selectedTariff === tariff.id ? 'text-primary mx-auto' : 'text-muted-foreground mx-auto'}
                        />
                        <p className={`text-xs font-semibold mt-1 ${selectedTariff === tariff.id ? 'text-primary' : 'text-foreground'}`}>
                          {tariff.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">от {tariff.basePrice}₽</p>
                      </button>
                    ))}
                  </div>
                </div>

                {from && to && (
                  <Button
                    onClick={calculateEstimate}
                    variant="outline"
                    className="w-full border-2"
                  >
                    <Icon name="Calculator" className="mr-2" size={18} />
                    Рассчитать стоимость
                  </Button>
                )}

                {estimatedPrice && (
                  <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="Wallet" className="text-accent" size={20} />
                        <span className="text-sm font-medium">Примерная стоимость</span>
                      </div>
                      <span className="text-2xl font-bold text-accent">{estimatedPrice}₽</span>
                    </div>
                  </div>
                )}

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
                        <div className="flex items-center gap-1">
                          <Icon name="Star" size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{currentOrder.driverRating}</span>
                          <span className="text-xs text-muted-foreground ml-1">• {currentOrder.carNumber}</span>
                        </div>
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
                  <div className="flex items-center justify-between pt-3 mt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Icon name={tariffs.find(t => t.id === currentOrder.tariff)?.icon as any} size={18} className="text-primary" />
                      <span className="text-sm font-medium">{tariffs.find(t => t.id === currentOrder.tariff)?.name}</span>
                      <span className="text-xs text-muted-foreground">• {currentOrder.distance} км</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{currentOrder.price}₽</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'history' && (
              <Card className="shadow-lg border-2 border-primary/30 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon name="History" size={24} />
                    История поездок
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="FileText" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Пока нет завершённых поездок</p>
                    </div>
                  ) : (
                    orderHistory.map((order) => (
                      <Card key={order.id} className="bg-gradient-to-br from-primary/5 to-accent/5">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Icon name="Calendar" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.date}</span>
                                <Icon name="Clock" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.time}</span>
                              </div>
                              <div className="space-y-1.5 mt-2">
                                <div className="flex items-start gap-2">
                                  <Icon name="Navigation" size={14} className="text-accent mt-0.5" />
                                  <p className="text-sm font-medium">{order.from}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Icon name="MapPinned" size={14} className="text-secondary mt-0.5" />
                                  <p className="text-sm font-medium">{order.to}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Icon name={tariffs.find(t => t.id === order.tariff)?.icon as any} size={16} className="text-primary" />
                              <span className="text-xs font-medium">{tariffs.find(t => t.id === order.tariff)?.name}</span>
                              <span className="text-xs text-muted-foreground">• {order.distance} км</span>
                            </div>
                            <span className="text-lg font-bold text-primary">{order.price}₽</span>
                          </div>
                          {order.driverName && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Icon name="User" size={14} />
                                <span>{order.driverName}</span>
                                {order.carNumber && <span>• {order.carNumber}</span>}
                                {order.driverRating && (
                                  <div className="flex items-center gap-1">
                                    <Icon name="Star" size={12} className="text-yellow-500 fill-yellow-500" />
                                    <span>{order.driverRating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {order.rating ? (
                            <div className="pt-2 border-t">
                              <div className="flex items-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    size={16}
                                    className={star <= order.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                              {order.review && (
                                <p className="text-xs text-muted-foreground italic">{order.review}</p>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={() => openRatingDialog(order)}
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                            >
                              <Icon name="Star" className="mr-2" size={14} />
                              Оценить поездку
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
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

        <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="Star" size={24} className="text-yellow-500" />
                Оценить поездку
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {selectedOrderForRating && (
                <>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="Navigation" size={14} />
                        <span>{selectedOrderForRating.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="MapPinned" size={14} />
                        <span>{selectedOrderForRating.to}</span>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      Водитель: {selectedOrderForRating.driverName} • {selectedOrderForRating.carNumber}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ваша оценка</label>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setTempRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Icon
                            name="Star"
                            size={40}
                            className={star <= tempRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Комментарий (необязательно)</label>
                    <Textarea
                      placeholder="Поделитесь впечатлениями о поездке..."
                      value={tempReview}
                      onChange={(e) => setTempReview(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={submitRating}
                    disabled={tempRating === 0}
                    className="w-full"
                  >
                    <Icon name="Send" className="mr-2" size={18} />
                    Отправить отзыв
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
                        <div className="flex items-center justify-between bg-accent/10 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon name={tariffs.find(t => t.id === order.tariff)?.icon as any} size={16} className="text-accent" />
                            <span className="text-xs font-medium">{tariffs.find(t => t.id === order.tariff)?.name}</span>
                            <span className="text-xs text-muted-foreground">• {order.distance} км</span>
                          </div>
                          <span className="text-lg font-bold text-accent">{order.price}₽</span>
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

            {activeSection === 'history' && (
              <Card className="shadow-lg border-2 border-secondary/30 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Icon name="History" size={24} />
                    История заказов
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="FileText" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Пока нет завершённых заказов</p>
                    </div>
                  ) : (
                    orderHistory.map((order) => (
                      <Card key={order.id} className="bg-gradient-to-br from-secondary/5 to-accent/5">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Icon name="Calendar" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.date}</span>
                                <Icon name="Clock" size={14} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{order.time}</span>
                              </div>
                              <div className="space-y-1.5 mt-2">
                                <div className="flex items-start gap-2">
                                  <Icon name="Navigation" size={14} className="text-accent mt-0.5" />
                                  <p className="text-sm font-medium">{order.from}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Icon name="MapPinned" size={14} className="text-secondary mt-0.5" />
                                  <p className="text-sm font-medium">{order.to}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Icon name={tariffs.find(t => t.id === order.tariff)?.icon as any} size={16} className="text-secondary" />
                              <span className="text-xs font-medium">{tariffs.find(t => t.id === order.tariff)?.name}</span>
                              <span className="text-xs text-muted-foreground">• {order.distance} км</span>
                            </div>
                            <span className="text-lg font-bold text-secondary">{order.price}₽</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

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