import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ThfNotificationService, ThfSelectOption } from '@totvs/thf-ui';

const actionInsert = 'insert';
const actionUpdate = 'update';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnDestroy, OnInit {

  public readonly genreOptions: Array<ThfSelectOption> = [
    { label: 'Feminino', value: 'Female' },
    { label: 'Masculino', value: 'Male' },
    { label: 'Outros', value: 'Other' }
  ];

  // PROPRIEDADE COM A URL DA API
  private readonly url: string = 'https://sample-customers-api.herokuapp.com/api/thf-samples/v1/people';

  public customer: any = { };

  private customerSub: Subscription;

  private paramsSub: Subscription;

  private action: string = actionInsert;

  constructor(private thfNotification: ThfNotificationService,
              private router: Router,
              private route: ActivatedRoute,
              private httpClient: HttpClient) { }

  save() {
    const customer = {...this.customer};

    customer.status = customer.status ? 'Active' : 'Inactive';

    // REFACTORY - FAZ A CHAMADA DE ACORDO COM O TIPO DA AÇÃO
    this.customerSub = this.isUpdateOperation
      ? this.httpClient.put(`${this.url}/${customer.id}`, customer)
        .subscribe(() => this.navigateToList('Cliente atualizado com sucesso'))
      : this.httpClient.post(this.url, customer)
        .subscribe(() => this.navigateToList('Cliente cadastrado com sucesso'));
  }

  cancel() {
    this.router.navigateByUrl('/customers');
  }

  private loadData(id) {
    this.customerSub = this.httpClient.get(`${this.url}/${id}`)
      // VAMOS PEGAR O VALOR QUE VEM DO BACKEND E ALTERAR PARA BOOLEAN
      .pipe(
        map((customer: any) => {
          customer.status = customer.status === 'Active';

          return customer;
        })
      )
      .subscribe(response => this.customer = response);
  }

  get isUpdateOperation() {
    return this.action === actionUpdate;
  }

  get title() {
    return this.isUpdateOperation ? 'Atualizando dados do cliente' : 'Novo cliente';
  }

  private navigateToList(msg: string) {
    this.thfNotification.success(msg);

    this.router.navigateByUrl('/customers');
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();

    if (this.customerSub) {
      this.customerSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.paramsSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadData(params['id']);
        // MUDAMOS O TIPO DE AÇÃO
        this.action = actionUpdate;
      }
    });
  }
}
