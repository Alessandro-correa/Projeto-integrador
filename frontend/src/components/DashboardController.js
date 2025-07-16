class DashboardController {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.charts = {};
        this.isLoading = false;
        console.log('[Dashboard] Inicializando...');
        
        // Verificar estado da autenticação
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        console.log('[Dashboard] Estado inicial:', {
            token: token ? 'Presente' : 'Ausente',
            userType: userType || 'Não definido'
        });
        
        this.bindEvents();
        this.handleOrientationChange();

        setTimeout(async () => {
            console.log('[Dashboard] Iniciando carregamento...');
            const isConnected = await this.testConnection();
            if (isConnected) {
                this.loadDashboard();
            } else {
                console.error('[Dashboard] Falha na conexão, carregamento cancelado');
            }
        }, 100);
    }

    bindEvents() {
        
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboard());
        }

        const periodFilter = document.getElementById('period-filter');
        if (periodFilter) {
            periodFilter.addEventListener('change', () => this.loadDashboard());
        }

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.refreshChartsForTheme();
            }, 500);
        });
    }

    async loadDashboard() {
        if (this.isLoading) {
            console.log('[Dashboard] Carregamento já em andamento, ignorando...');
            return;
        }
        
        this.isLoading = true;
        this.showLoading();

        try {
            console.log('[Dashboard] Iniciando carregamento do dashboard...');
            await this.loadStats();
            await this.loadCharts();
            console.log('[Dashboard] Dashboard carregado com sucesso');
        } catch (error) {
            console.error('[Dashboard] Erro ao carregar dashboard:', error);
            this.showError('Erro ao carregar dados do dashboard');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadStats() {
        try {
            console.log('[Dashboard] Iniciando carregamento de estatísticas...');
            const data = await window.apiService.getDashboardStats();
            
            console.log('[Dashboard] Estatísticas recebidas:', data);

            if (data.success) {
                this.updateStatsCards(data.data);
                console.log('[Dashboard] Estatísticas atualizadas com sucesso');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('[Dashboard] Erro ao carregar estatísticas:', error);
            throw error;
        }
    }

    updateStatsCards(stats) {
        
        const animateNumber = (element, finalValue, suffix = '') => {
            if (!element) return;
            element.classList.add('updating');
            
            setTimeout(() => {
                element.textContent = finalValue + suffix;
                element.classList.remove('updating');
            }, 300);
        };

        const totalServicos = document.getElementById('total-servicos');
        animateNumber(totalServicos, stats.totalServicos || '0');

        const servicosMes = document.getElementById('servicos-mes');
        animateNumber(servicosMes, stats.servicosNoMes || '0');

        const crescimentoMensal = document.getElementById('crescimento-mensal');
        if (crescimentoMensal) {
            const crescimento = stats.crescimentoMensal || 0;
            const valor = `${crescimento >= 0 ? '+' : ''}${crescimento}%`;
            crescimentoMensal.textContent = valor;

            crescimentoMensal.classList.remove('positive', 'negative', 'neutral');

            if (crescimento > 0) {
                crescimentoMensal.classList.add('positive');
            } else if (crescimento < 0) {
                crescimentoMensal.classList.add('negative');
            } else {
                crescimentoMensal.classList.add('neutral');
            }
        }

        const taxaRetorno = document.getElementById('taxa-retorno');
        animateNumber(taxaRetorno, stats.taxaRetorno || '0', '%');

        const motosManutencao = document.getElementById('motos-manutencao');
        animateNumber(motosManutencao, stats.motosEmManutencao || '0');

        const orcamentosPendentes = document.getElementById('orcamentos-pendentes');
        animateNumber(orcamentosPendentes, stats.orcamentosPendentes || '0');
    }

    async loadCharts() {
        try {
            console.log('DashboardController: Carregando gráficos...');
            const data = await window.apiService.getDashboardCharts();
            
            console.log('DashboardController: Dados de gráficos recebidos:', data);

            if (data.success) {
                const chartsData = data.data;

                this.createServicosChart(chartsData.servicosPorMes);
                this.createTiposServicosChart(chartsData.tiposServicos);
                this.createServicosPorMotoChart(chartsData.servicosPorMoto);
                this.createTaxaRetornoChart(chartsData.taxaRetorno);
                
                console.log('DashboardController: Gráficos criados com sucesso');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('DashboardController: Erro ao carregar gráficos:', error);
            throw error;
        }
    }

    createServicosChart(data) {
        const chartElement = document.getElementById('servicos-chart');
        if (!chartElement || !data) return;

        if (this.charts.servicosChart) {
            this.charts.servicosChart.destroy();
        }

        const isDark = document.body.classList.contains('dark');

        const options = {
            series: [{
                name: 'Serviços',
                data: data.map(item => item.total)
            }],
            chart: {
                type: 'area',
                height: this.getResponsiveChartHeight(),
                toolbar: {
                    show: false
                },
                fontFamily: 'Open Sans, sans-serif',
                foreColor: isDark ? '#A0A0A0' : '#666666'
            },
            colors: ['#3b82f6'],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            xaxis: {
                categories: data.map(item => item.mes),
                labels: {
                    style: {
                        fontSize: '12px',
                        colors: isDark ? '#A0A0A0' : '#666666'
                    }
                },
                axisBorder: {
                    color: isDark ? '#2D2D2D' : '#E0E0E0'
                },
                axisTicks: {
                    color: isDark ? '#2D2D2D' : '#E0E0E0'
                }
            },
            yaxis: {
                title: {
                    text: 'Quantidade de Serviços',
                    style: {
                        color: isDark ? '#A0A0A0' : '#666666'
                    }
                },
                labels: {
                    style: {
                        colors: isDark ? '#A0A0A0' : '#666666'
                    }
                }
            },
            grid: {
                borderColor: isDark ? '#2D2D2D' : '#E0E0E0',
                strokeDashArray: 3
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.1,
                    stops: [0, 100]
                }
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: function(val) {
                        return val + " serviços";
                    }
                }
            },
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300
                    }
                }
            }]
        };

        this.charts.servicosChart = new ApexCharts(chartElement, options);
        this.charts.servicosChart.render();
    }

    createTiposServicosChart(data) {
        const chartElement = document.getElementById('tipos-servicos-chart');
        if (!chartElement || !data) return;

        if (this.charts.tiposChart) {
            this.charts.tiposChart.destroy();
        }

        const isDark = document.body.classList.contains('dark');

        const options = {
            series: data.map(item => item.total),
            chart: {
                type: 'donut',
                height: this.getResponsiveChartHeight(),
                fontFamily: 'Open Sans, sans-serif',
                foreColor: isDark ? '#A0A0A0' : '#666666'
            },
            labels: data.map(item => item.tipo),
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'],
            legend: {
                position: 'bottom',
                labels: {
                    colors: isDark ? '#A0A0A0' : '#666666'
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '60%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'Total',
                                fontSize: '16px',
                                fontWeight: 600,
                                color: isDark ? '#E0E0E0' : '#333333',
                                formatter: function (w) {
                                    return w.globals.seriesTotals.reduce((a, b) => {
                                        return a + b
                                    }, 0)
                                }
                            },
                            value: {
                                show: true,
                                fontSize: '24px',
                                fontWeight: 700,
                                color: isDark ? '#E0E0E0' : '#333333'
                            }
                        }
                    }
                }
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: function(val) {
                        return val + " serviços";
                    }
                }
            },
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }, {
                breakpoint: 480,
                options: {
                    chart: {
                        height: 250
                    },
                    legend: {
                        position: 'bottom',
                        fontSize: '12px'
                    }
                }
            }]
        };

        this.charts.tiposChart = new ApexCharts(chartElement, options);
        this.charts.tiposChart.render();
    }

    createServicosPorMotoChart(data) {
        const chartElement = document.getElementById('servicos-moto-chart');
        if (!chartElement || !data) return;

        if (this.charts.motosChart) {
            this.charts.motosChart.destroy();
        }

        const isDark = document.body.classList.contains('dark');

        const options = {
            series: [{
                name: 'Serviços',
                data: data.map(item => ({
                    x: item.marca,
                    y: item.total
                }))
            }],
            chart: {
                type: 'bar',
                height: this.getResponsiveChartHeight(),
                toolbar: {
                    show: false
                },
                fontFamily: 'Open Sans, sans-serif',
                foreColor: isDark ? '#A0A0A0' : '#666666'
            },
            colors: ['#10b981'],
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 6,
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            dataLabels: {
                enabled: true,
                offsetX: 10,
                style: {
                    fontSize: '12px',
                    colors: [isDark ? '#E0E0E0' : '#333333']
                }
            },
            xaxis: {
                title: {
                    text: 'Quantidade de Serviços',
                    style: {
                        color: isDark ? '#A0A0A0' : '#666666'
                    }
                },
                labels: {
                    style: {
                        colors: isDark ? '#A0A0A0' : '#666666'
                    }
                },
                axisBorder: {
                    color: isDark ? '#2D2D2D' : '#E0E0E0'
                }
            },
            yaxis: {
                title: {
                    text: 'Marca da Motocicleta',
                    style: {
                        color: isDark ? '#A0A0A0' : '#666666'
                    }
                },
                labels: {
                    style: {
                        colors: isDark ? '#A0A0A0' : '#666666'
                    }
                }
            },
            grid: {
                borderColor: isDark ? '#2D2D2D' : '#E0E0E0',
                strokeDashArray: 3
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: function(val) {
                        return val + " serviços";
                    }
                }
            },
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300
                    },
                    plotOptions: {
                        bar: {
                            horizontal: false
                        }
                    },
                    xaxis: {
                        title: {
                            text: 'Marca da Motocicleta'
                        }
                    },
                    yaxis: {
                        title: {
                            text: 'Quantidade de Serviços'
                        }
                    }
                }
            }]
        };

        this.charts.motosChart = new ApexCharts(chartElement, options);
        this.charts.motosChart.render();
    }

    createTaxaRetornoChart(data) {
        const chartElement = document.getElementById('taxa-retorno-chart');
        if (!chartElement || !data) return;

        if (this.charts.retornoChart) {
            this.charts.retornoChart.destroy();
        }

        const isDark = document.body.classList.contains('dark');

        const options = {
            series: [{
                name: 'Taxa de Retorno',
                data: data.map(item => parseFloat(item.taxa_retorno))
            }],
            chart: {
                type: 'line',
                height: this.getResponsiveChartHeight(),
                toolbar: {
                    show: false
                },
                fontFamily: 'Open Sans, sans-serif',
                foreColor: isDark ? '#A0A0A0' : '#666666'
            },
            colors: ['#ef4444'],
            stroke: {
                curve: 'smooth',
                width: 4
            },
            xaxis: {
                categories: data.map(item => item.mes),
                labels: {
                    style: {
                        fontSize: '12px',
                        colors: isDark ? '#A0A0A0' : '#666666'
                    }
                },
                axisBorder: {
                    color: isDark ? '#2D2D2D' : '#E0E0E0'
                },
                axisTicks: {
                    color: isDark ? '#2D2D2D' : '#E0E0E0'
                }
            },
            yaxis: {
                title: {
                    text: 'Taxa de Retorno (%)',
                    style: {
                        color: isDark ? '#A0A0A0' : '#666666'
                    }
                },
                min: 0,
                max: 100,
                labels: {
                    style: {
                        colors: isDark ? '#A0A0A0' : '#666666'
                    },
                    formatter: function(val) {
                        return val.toFixed(0) + '%';
                    }
                }
            },
            grid: {
                borderColor: isDark ? '#2D2D2D' : '#E0E0E0',
                strokeDashArray: 3
            },
            markers: {
                size: 6,
                colors: ['#ef4444'],
                strokeColors: isDark ? '#1E1E1E' : '#fff',
                strokeWidth: 2,
                hover: {
                    size: 8
                }
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                y: {
                    formatter: function(val) {
                        return val.toFixed(1) + "%";
                    }
                }
            },
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300
                    },
                    markers: {
                        size: 4
                    }
                }
            }]
        };

        this.charts.retornoChart = new ApexCharts(chartElement, options);
        this.charts.retornoChart.render();
    }

    showLoading() {
        const loadingElements = document.querySelectorAll('.chart-loading');
        loadingElements.forEach(element => {
            element.style.display = 'flex';
        });

        const chartElements = document.querySelectorAll('.chart-container');
        chartElements.forEach(element => {
            element.style.opacity = '0.5';
        });
    }

    hideLoading() {
        const loadingElements = document.querySelectorAll('.chart-loading');
        loadingElements.forEach(element => {
            element.style.display = 'none';
        });

        const chartElements = document.querySelectorAll('.chart-container');
        chartElements.forEach(element => {
            element.style.opacity = '1';
        });
    }

    showError(message) {
        const errorContainer = document.getElementById('dashboard-error');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';

            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        }
    }

    startAutoRefresh(intervalMinutes = 5) {
        setInterval(() => {
            this.loadDashboard();
        }, intervalMinutes * 60 * 1000);
    }

    refreshChartsForTheme() {
        
        setTimeout(() => {
            if (this.charts.servicosChart) {
                this.charts.servicosChart.destroy();
                this.loadCharts();
            }
        }, 100);
    }

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    isMobileDevice() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    getResponsiveChartHeight() {
        const isMobile = this.isMobileDevice();
        return isMobile ? 280 : 350;
    }

    async testConnection() {
        console.log('DashboardController: Testando conexão com API...');
        try {
            const response = await fetch(`${this.API_BASE_URL}/dashboard/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            console.log('DashboardController: Status da resposta:', response.status);
            console.log('DashboardController: Headers da resposta:', [...response.headers.entries()]);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('DashboardController: Teste de conexão bem-sucedido:', data);
            return true;
        } catch (error) {
            console.error('DashboardController: Erro no teste de conexão:', error);
            this.showError(`Erro de conexão: ${error.message}`);
            return false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando DashboardController...');
    window.dashboardController = new DashboardController();

});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.dashboardController) {
            console.log('Fallback: Inicializando DashboardController...');
            window.dashboardController = new DashboardController();
        }
    });
} else {
    
    console.log('DOM já carregado, inicializando DashboardController imediatamente...');
    window.dashboardController = new DashboardController();
}
