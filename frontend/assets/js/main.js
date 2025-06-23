import ThemeController from '../../controllers/ThemeController.js';
import SidebarController from '../../controllers/SidebarController.js';
import NavbarController from '../../controllers/NavbarController.js';
import FormController from '../../controllers/FormController.js';
import FilterController from '../../controllers/FilterController.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar controladores básicos
        this.themeController = new ThemeController();
        this.sidebarController = new SidebarController();
        this.navbarController = new NavbarController();
        this.formController = new FormController();

        // Inicializar controladores específicos baseados na página atual
        this.initPageSpecificControllers();
        
        // Inicializar progress bars
        this.initProgressBars();
        
        // Inicializar gráficos se existirem
        this.initCharts();
    }

    initPageSpecificControllers() {
        // Inicializar filtros baseado na tabela presente na página
        const tableIds = ['os-table', 'clientes-table', 'motos-table', 'marcas-table', 
                         'fornecedores-table', 'pecas-table', 'orcamentos-table'];
        
        tableIds.forEach(tableId => {
            if (document.getElementById(tableId)) {
                this.filterController = new FilterController(tableId);
            }
        });
    }

    initProgressBars() {
        const allProgress = document.querySelectorAll('main .card .progress');
        allProgress.forEach(item => {
            item.style.setProperty('--value', item.dataset.value);
        });
    }

    initCharts() {
        // Gráfico de barras (Dashboard)
        if (document.querySelector("#chart")) {
            this.initBarChart();
        }

        // Gráfico de rosca (Dashboard)
        if (document.querySelector("#donut-chart")) {
            this.initDonutChart();
        }

        // Gráfico de pizza para motocicletas (Dashboard)
        if (document.querySelector("#pie-chart-moto")) {
            this.initPieChartMoto();
        }
    }

    initBarChart() {
        const options = {
            series: [{
                name: 'Serviços',
                data: [45, 52, 38, 48, 62, 55, 70]
            }],
            chart: {
                height: 350,
                type: 'bar',
                foreColor: '#A0A0A0'
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    horizontal: false,
                    columnWidth: '40%',
                }
            },
            dataLabels: {
                enabled: false
            },
            colors: ['#28a745'],
            xaxis: {
                categories: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"],
            },
            legend: {
                show: false
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function (val) {
                        return val + " serviços";
                    }
                }
            },
        };
        
        if (typeof ApexCharts !== 'undefined') {
            const chart = new ApexCharts(document.querySelector("#chart"), options);
            chart.render();
        }
    }

    initDonutChart() {
        const donutOptions = {
            series: [35, 25, 15, 10, 15],
            chart: {
                height: 350,
                type: 'donut',
                foreColor: '#A0A0A0'
            },
            labels: ['Troca de Óleo', 'Revisão', 'Freios', 'Pneus', 'Outros'],
            colors: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'],
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }],
            tooltip: {
                theme: 'dark'
            }
        };

        if (typeof ApexCharts !== 'undefined') {
            const donut = new ApexCharts(document.querySelector("#donut-chart"), donutOptions);
            donut.render();
        }
    }

    initPieChartMoto() {
        const motoOptions = {
            series: [55, 35, 10],
            chart: {
                height: 350,
                type: 'pie',
                foreColor: '#A0A0A0'
            },
            labels: ['Urbana (Street/Scooter)', 'Esportiva', 'Trail/Custom'],
            colors: ['#17a2b8', '#ffc107', '#dc3545'],
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }],
            tooltip: {
                theme: 'dark'
            }
        };

        if (typeof ApexCharts !== 'undefined') {
            const motoChart = new ApexCharts(document.querySelector("#pie-chart-moto"), motoOptions);
            motoChart.render();
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new App();
});