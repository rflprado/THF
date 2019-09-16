import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ThfNotificationService } from '@totvs/thf-ui';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnDestroy, OnInit {

  // URL DA NOSSA API
  private readonly url: string = 'https://sample-customers-api.herokuapp.com/api/thf-samples/v1/people';

  private customerSub: Subscription;
  private paramsSub: Subscription;
  private customerRemoveSub: Subscription;

  customer: any = {};

  constructor(private httpClient: HttpClient,
              private route: ActivatedRoute,
              private router: Router,
              private thfNotification: ThfNotificationService) { }

  // FUNÇÃO QUE CARREGA OS DADOS DO CLIENTE
  private loadData(id) {
    this.customerSub = this.httpClient.get(`${this.url}/${id}`)
      // INCLUSÃO DO MAP PARA TRANSFORMAR OS DADOS
      .pipe(
        map((customer: any) => {
          const status = { Active: 'Ativo', Inactive: 'Inativo' };

          const genre = { Female: 'Feminino', Male: 'Masculino', Other: 'Outros' };

          customer.status = status[customer.status];
          customer.genre = genre[customer.genre];

          return customer;
        })
      )
      .subscribe(response => this.customer = response);
  }

  edit() {
    this.router.navigateByUrl(`customers/edit/${this.customer.id}`);
  }

  remove() {
    this.customerRemoveSub = this.httpClient.delete(`${this.url}/${this.customer.id}`)
      .subscribe(() => {
        this.thfNotification.warning('Cadastro do cliente apagado com sucesso.');

        this.back();
      });
  }

  back() {
    this.router.navigateByUrl('customers');
  }

  ngOnInit() {
    // APENAS PEGAMOS O ID DA ROTA ATIVA E PASSAMOS PARA NOSSA FUNÇÃO LOADDATA
    this.paramsSub = this.route.params.subscribe(params => this.loadData(params['id']));
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
    this.customerSub.unsubscribe();

    // NOVAS LINHAS
    if (this.customerRemoveSub) {
      this.customerRemoveSub.unsubscribe();
    }
  }
}
