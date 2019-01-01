import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import { RouterExtensions } from 'nativescript-angular/router'


@Component({
    moduleId: module.id,
    selector: 'ns-c',
    templateUrl: './c.component.html',
    styleUrls: ['./c.component.css']
})
export class CComponent implements OnInit {

    @ViewChild('scrollView') scrollView: ElementRef

    private isLoading = true

    constructor(
        private router: RouterExtensions,
    ) { }

    ngOnInit() { }


}
